import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useApp } from '../../context/AppContext';
import { formatImageUrl } from '../../utils/imageUrl';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Sparkles,
  Check,
  X,
  Cake,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  FolderTree,
  Loader2,
  CheckCircle2,
  Info,
  Download,
  FileSpreadsheet,
  FileUp,
  AlertCircle,
  Scale,
  Layers
} from 'lucide-react';

const DEFAULT_CAKE_SHAPES = [
  { shape: 'Heart', name: 'Heart Shape', egg_price: '650', eggless_price: '700', image: '', is_active: true },
  { shape: 'Round', name: 'Round Shape', egg_price: '500', eggless_price: '550', image: '', is_active: true },
  { shape: 'Square', name: 'Square Shape', egg_price: '600', eggless_price: '650', image: '', is_active: true },
];

const AdminProductsPage = () => {
  const { showToast } = useApp();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [selectedSubcat, setSelectedSubcat] = useState('');

  // Bulk CSV Import / Export State
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState([]);
  const [exportingCsv, setExportingCsv] = useState(false);
  const bulkFileInputRef = useRef(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Image Upload State (Local Gallery vs URL Link)
  const [imageMode, setImageMode] = useState('gallery'); // 'gallery' or 'url'
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadSuccessName, setUploadSuccessName] = useState('');
  const [uploadingShapeIndex, setUploadingShapeIndex] = useState(null);
  const fileInputRef = useRef(null);
  const defaultCupcakeVariants = {
    cream_options: [
      { id: 'with_cream', name: 'With Cream' },
      { id: 'without_cream', name: 'Without Cream' },
    ],
    egg_options: [
      { id: 'egg', name: 'With Egg', badge: 'Classic' },
      { id: 'eggless', name: '100% Pure Eggless', badge: 'Veg' },
    ],
    matrix: [
      { cream_id: 'with_cream', egg_id: 'egg', price: '55', is_available: true },
      { cream_id: 'with_cream', egg_id: 'eggless', price: '65', is_available: true },
      { cream_id: 'without_cream', egg_id: 'egg', price: '40', is_available: true },
      { cream_id: 'without_cream', egg_id: 'eggless', price: '45', is_available: true },
    ],
  };

  const defaultSnackVariants = {
    pricing_type: 'both', // 'piece' | 'weight' | 'both'
    piece: {
      egg_price: '40',
      eggless_price: '50',
      is_available: true,
    },
    weight: {
      unit: 'grams', // 'grams' | 'kg'
      value: '250g',
      egg_price: '120',
      eggless_price: '140',
      is_available: true,
    },
  };

  const [newCreamInput, setNewCreamInput] = useState('');
  const [newEggInput, setNewEggInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category_id: '',
    subcategory_id: '',
    base_price: '',
    discount_price: '',
    weight: '500g',
    portion_type: 'weight', // 'weight', 'portion', 'both'
    portion_unit: 'grams',  // 'grams', 'kg', 'pieces', 'slices', 'portions'
    portion_step: '500g',   // '500g', '1kg', '1', etc.
    piece_price: '120',
    piece_limit: '20',
    piece_min: '1',
    is_unlimited_pieces: false,
    short_description: '',
    description: '',
    is_eggless: true,
    is_available: true,
    is_featured: false,
    is_popular: false,
    is_new_arrival: false,
    is_gifting: false,
    image_url: '',
    variants: [
      { size_weight: '500g', price: '', discount_price: '' },
      { size_weight: '1kg', price: '', discount_price: '' },
    ],
    shapes: DEFAULT_CAKE_SHAPES,
    enable_cupcake_matrix: false,
    cupcake_variants: defaultCupcakeVariants,
    enable_snack_matrix: false,
    snack_variants: defaultSnackVariants,
    theme_cake_default_weight: '5',
    theme_cake_default_price: '2000',
    theme_cake_step_size: '1',
    theme_cake_price_tiers: [],
    dessert_min_quantity: '2',
    dessert_default_price: '100',
    dessert_step_size: 1,
    dessert_price_tiers: [],
    sell_by_kg: true,
    kg_step: '0.5',
    kg_default: '0.5',
    kg_max: '10',
    kg_price: '',
    sell_by_pieces: false,
    piece_default: '1',
    piece_step: '1',
    piece_max: '20',
    enable_fixed_weight_pricing: false,
    fixed_weight_options: [],
    chocolate_pack_options: [],
    chocolate_pricing_type: 'weight',
  });

  const [dietFilter, setDietFilter] = useState(''); // '', 'true', 'false'
  const [stockFilter, setStockFilter] = useState(''); // '', 'in_stock', 'out_of_stock'
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(15);
  const [pagination, setPagination] = useState({
    total: 0,
    current_page: 1,
    last_page: 1,
    per_page: 15,
  });
  const location = useLocation();
  const navigate = useNavigate();

  // Handle URL query parameters: ?action=new to open modal, ?filter=out_of_stock, ?category_id=X, ?section=slug
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catId = params.get('category_id');
    const sectionSlug = params.get('section') || params.get('category');

    if (catId) {
      setSelectedCat(catId);
      setSelectedSubcat('');
      setCurrentPage(1);
    } else if (sectionSlug && categories.length > 0) {
      const found = categories.find((c) => c.slug === sectionSlug);
      if (found) {
        setSelectedCat(String(found.id));
        setSelectedSubcat('');
        setCurrentPage(1);
      }
    } else if (!params.get('filter') && !params.get('action') && !location.search) {
      setSelectedCat('');
      setSelectedSubcat('');
      setStockFilter('');
      setCurrentPage(1);
    }

    if (params.get('action') === 'new') {
      handleOpenAdd();
    }
    if (params.get('filter') === 'out_of_stock') {
      setStockFilter('out_of_stock');
    } else if (params.get('filter') === 'in_stock') {
      setStockFilter('in_stock');
    } else if (!params.get('filter')) {
      setStockFilter('');
    }
  }, [location.search, categories]);

  const fetchProducts = async (pageToFetch = currentPage) => {
    setLoading(true);
    try {
      let url = `/admin/products?search=${encodeURIComponent(search)}&page=${pageToFetch}&per_page=${perPage}`;
      if (selectedCat) url += `&category_id=${selectedCat}`;
      if (selectedSubcat) url += `&subcategory_id=${selectedSubcat}`;
      if (dietFilter) url += `&is_eggless=${dietFilter}`;
      if (stockFilter) url += `&stock_status=${stockFilter}`;
      const res = await api.get(url);
      if (res.data?.data) {
        setProducts(res.data.data);
        if (res.data.pagination) {
          setPagination(res.data.pagination);
        }
      }
    } catch (err) {
      console.warn('Error loading admin products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage, search, selectedCat, selectedSubcat, dietFilter, stockFilter, perPage]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/admin/categories');
        if (res.data?.data) {
          setCategories(res.data.data);
          if (res.data.data.length > 0 && !formData.category_id) {
            setFormData((prev) => ({ ...prev, category_id: res.data.data[0].id }));
          }
        }
      } catch (err) {
        // ignore
      }
    };
    fetchCats();
  }, []);

  // Compute available subcategories for currently selected category in modal
  const selectedCategoryObj = categories.find((c) => String(c.id) === String(formData.category_id));
  const availableSubcategories = selectedCategoryObj?.subcategories || [];
  const isThemeCakeSelected = Boolean(
    selectedCategoryObj?.slug === 'theme-cakes' ||
    selectedCategoryObj?.name?.toLowerCase().includes('theme cake') ||
    String(formData.category_id) === '8'
  );
  const isDessertSelected = Boolean(
    selectedCategoryObj?.slug === 'dessert' ||
    selectedCategoryObj?.name?.toLowerCase().includes('dessert') ||
    String(formData.category_id) === '3'
  );
  const isDryFruitSelected = Boolean(
    selectedCategoryObj?.slug === 'dry-fruits' ||
    selectedCategoryObj?.name?.toLowerCase().includes('dry fruit') ||
    String(formData.category_id) === '4'
  );
  const isChocolatesSelected = Boolean(
    selectedCategoryObj?.slug === 'chocolates' ||
    selectedCategoryObj?.name?.toLowerCase().includes('chocolate') ||
    String(formData.category_id) === '5'
  );
  const isCakesAndPastriesSelected = Boolean(
    selectedCategoryObj?.slug === 'cakes-pastries' ||
    selectedCategoryObj?.name?.toLowerCase().includes('cakes & pastries') ||
    selectedCategoryObj?.name?.toLowerCase().includes('cakes and pastries') ||
    String(formData.category_id) === '1'
  );
  const isSweetsSelected = Boolean(
    selectedCategoryObj?.slug === 'sweets' ||
    selectedCategoryObj?.name?.toLowerCase().includes('sweet') ||
    String(formData.category_id) === '9'
  );
  const isCakesOrSweetsSelected = isCakesAndPastriesSelected || isSweetsSelected;

  // Compute available subcategories for category filter
  const filterCategoryObj = categories.find((c) => String(c.id) === String(selectedCat));
  const filterSubcategories = filterCategoryObj?.subcategories || [];

  const handleOpenAdd = () => {
    setEditingId(null);
    setUploadSuccessName('');
    const defaultCat = categories.find((c) => c.slug === 'cakes-pastries') || categories[0];
    const defaultSub = defaultCat?.subcategories?.[0]?.id || '';

    setFormData({
      name: '',
      sku: 'AMP-' + Math.floor(1000 + Math.random() * 9000),
      category_id: defaultCat?.id || '',
      subcategory_id: defaultSub,
      base_price: '499',
      discount_price: '450',
      weight: '500g',
      portion_type: 'weight',
      portion_unit: 'grams',
      portion_step: '500g',
      piece_price: '120',
      piece_limit: '20',
      piece_min: '1',
      is_unlimited_pieces: false,
      short_description: '',
      description: '',
      is_eggless: true,
      is_available: true,
      is_featured: false,
      is_popular: false,
      is_new_arrival: true,
      is_gifting: false,
      image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700',
      variants: [
        { size_weight: '500g', price: '499', discount_price: '450' },
        { size_weight: '1kg', price: '949', discount_price: '899' },
        { size_weight: '1.5kg', price: '1399', discount_price: '' },
        { size_weight: '2kg', price: '1799', discount_price: '' },
      ],
      enable_cupcake_matrix: false,
      cupcake_variants: defaultCupcakeVariants,
      enable_snack_matrix: defaultCat?.slug === 'snacks' || defaultCat?.name?.toLowerCase() === 'snacks',
      snack_variants: defaultSnackVariants,
      theme_cake_default_weight: '5',
      theme_cake_default_price: '2000',
      theme_cake_step_size: '1',
      theme_cake_price_tiers: [],
      dessert_min_quantity: '2',
      dessert_default_price: '100',
      dessert_step_size: 1,
      dessert_price_tiers: [],
      dry_fruit_pack_options: [],
      chocolate_pack_options: [],
      chocolate_pricing_type: 'weight',
      sell_by_kg: true,
      kg_step: '0.5',
      kg_default: '0.5',
      kg_max: '10',
      kg_price: '499',
      sell_by_pieces: false,
      piece_default: '1',
      piece_step: '1',
      piece_max: '20',
      enable_fixed_weight_pricing: false,
      fixed_weight_options: [],
      shapes: DEFAULT_CAKE_SHAPES,
    });
    setNewCreamInput('');
    setNewEggInput('');
    setImageMode('gallery');
    setModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingId(product.id);
    setUploadSuccessName('');
    const hasExistingMatrix = Boolean(
      product.cupcake_variants?.matrix && product.cupcake_variants.matrix.length > 0
    );
    const isCupcakeProduct = Boolean(
      product.subcategory_id === 20 ||
      String(product.name || '').toLowerCase().includes('cup cake') ||
      String(product.name || '').toLowerCase().includes('cupcake')
    );
    const isSnackProduct = Boolean(
      product.category?.slug === 'snacks' ||
      product.category?.name?.toLowerCase() === 'snacks' ||
      categories.find((c) => String(c.id) === String(product.category_id))?.slug === 'snacks' ||
      Boolean(product.snack_variants?.pricing_type)
    );
    const isThemeProduct = Boolean(
      product.category?.slug === 'theme-cakes' ||
      product.category?.name?.toLowerCase().includes('theme cake') ||
      categories.find((c) => String(c.id) === String(product.category_id))?.slug === 'theme-cakes' ||
      String(product.category_id) === '8' ||
      (product.theme_cake_default_weight && Number(product.theme_cake_default_weight) > 0)
    );
    const isDessertProduct = Boolean(
      product.category?.slug === 'dessert' ||
      product.category?.name?.toLowerCase().includes('dessert') ||
      categories.find((c) => String(c.id) === String(product.category_id))?.slug === 'dessert' ||
      String(product.category_id) === '3' ||
      (product.dessert_min_quantity && Number(product.dessert_min_quantity) > 0)
    );
    const isDryFruitProduct = Boolean(
      product.category?.slug === 'dry-fruits' ||
      product.category?.name?.toLowerCase().includes('dry fruit') ||
      categories.find((c) => String(c.id) === String(product.category_id))?.slug === 'dry-fruits' ||
      String(product.category_id) === '4' ||
      (Array.isArray(product.dry_fruit_pack_options) && product.dry_fruit_pack_options.length > 0)
    );

    let parsedTiers = [];
    if (Array.isArray(product.theme_cake_price_tiers)) {
      parsedTiers = product.theme_cake_price_tiers;
    } else if (typeof product.theme_cake_price_tiers === 'string') {
      try {
        parsedTiers = JSON.parse(product.theme_cake_price_tiers);
      } catch (e) {
        parsedTiers = [];
      }
    }

    let parsedDessertTiers = [];
    if (Array.isArray(product.dessert_price_tiers)) {
      parsedDessertTiers = product.dessert_price_tiers;
    } else if (typeof product.dessert_price_tiers === 'string') {
      try {
        parsedDessertTiers = JSON.parse(product.dessert_price_tiers);
      } catch (e) {
        parsedDessertTiers = [];
      }
    }

    let parsedDryFruitPacks = [];
    if (Array.isArray(product.dry_fruit_pack_options)) {
      parsedDryFruitPacks = product.dry_fruit_pack_options;
    } else if (typeof product.dry_fruit_pack_options === 'string') {
      try {
        parsedDryFruitPacks = JSON.parse(product.dry_fruit_pack_options);
      } catch (e) {
        parsedDryFruitPacks = [];
      }
    }
    if (isDryFruitProduct && parsedDryFruitPacks.length === 0) {
      const match = String(product.weight || '').match(/^(\d+(?:\.\d+)?)\s*(g|kg)?$/i);
      const w = match ? Number(match[1]) : 200;
      const u = match && match[2] ? match[2].toLowerCase() : (w <= 10 ? 'kg' : 'g');
      parsedDryFruitPacks = [
        { weight: w, unit: u, label: `${w}${u}`, price: Number(product.base_price || 150) }
      ];
    }

    const isChocolateProduct = Boolean(
      product.category?.slug === 'chocolates' ||
      product.category?.name?.toLowerCase().includes('chocolate') ||
      categories.find((c) => String(c.id) === String(product.category_id))?.slug === 'chocolates' ||
      String(product.category_id) === '5' ||
      (Array.isArray(product.chocolate_pack_options) && product.chocolate_pack_options.length > 0)
    );

    let parsedChocolatePacks = [];
    if (Array.isArray(product.chocolate_pack_options)) {
      parsedChocolatePacks = product.chocolate_pack_options;
    } else if (typeof product.chocolate_pack_options === 'string') {
      try {
        parsedChocolatePacks = JSON.parse(product.chocolate_pack_options);
      } catch (e) {
        parsedChocolatePacks = [];
      }
    }
    if (isChocolateProduct && parsedChocolatePacks.length === 0 && (!product.chocolate_pricing_type || product.chocolate_pricing_type === 'weight')) {
      const match = String(product.weight || '').match(/^(\d+(?:\.\d+)?)\s*(g|kg)?$/i);
      const w = match ? Number(match[1]) : 100;
      const u = match && match[2] ? match[2].toLowerCase() : (w <= 10 ? 'kg' : 'g');
      parsedChocolatePacks = [
        { weight: w, unit: u, label: `${w}${u}`, price: Number(product.base_price || 120) }
      ];
    }

    let parsedFixedWeightOptions = [];
    if (Array.isArray(product.fixed_weight_options)) {
      parsedFixedWeightOptions = product.fixed_weight_options;
    } else if (typeof product.fixed_weight_options === 'string') {
      try {
        parsedFixedWeightOptions = JSON.parse(product.fixed_weight_options);
      } catch (e) {
        parsedFixedWeightOptions = [];
      }
    }

    let parsedShapes = [];
    if (Array.isArray(product.shapes)) {
      parsedShapes = product.shapes;
    } else if (typeof product.shapes === 'string') {
      try {
        parsedShapes = JSON.parse(product.shapes);
      } catch (e) {
        parsedShapes = [];
      }
    }

    const mergedShapes = parsedShapes.length > 0
      ? parsedShapes.map((s) => ({
          id: s.id || (s.shape ? String(s.shape).toLowerCase() : 'shape'),
          shape: s.shape || s.name || 'Shape',
          name: s.name || (s.shape ? `${s.shape} Shape` : 'Custom Shape'),
          egg_price: s.egg_price !== undefined && s.egg_price !== null && s.egg_price !== ''
            ? String(s.egg_price)
            : (s.price !== undefined && s.price !== null ? String(s.price) : ''),
          eggless_price: s.eggless_price !== undefined && s.eggless_price !== null && s.eggless_price !== ''
            ? String(s.eggless_price)
            : (s.price !== undefined && s.price !== null ? String(s.price) : ''),
          image: s.image || '',
          is_active: s.is_active !== undefined ? Boolean(s.is_active) : true,
        }))
      : DEFAULT_CAKE_SHAPES.map((def) => ({
          ...def,
          egg_price: String(def.egg_price || product.egg_price || product.base_price || '650'),
          eggless_price: String(def.eggless_price || product.eggless_price || '700'),
          image: def.shape === 'Heart' ? (product.image_url || '') : '',
          is_active: true,
        }));

      const dessertMinQty = product.dessert_min_quantity !== null && product.dessert_min_quantity !== undefined
        ? String(product.dessert_min_quantity)
        : (product.piece_default ? String(product.piece_default) : (isDessertProduct ? '1' : '1'));
      const dessertStep = product.dessert_step_size !== null && product.dessert_step_size !== undefined
        ? String(product.dessert_step_size)
        : (product.piece_step ? String(product.piece_step) : '1');
      const dessertMax = product.piece_limit !== null && product.piece_limit !== undefined
        ? String(product.piece_limit)
        : (product.piece_max ? String(product.piece_max) : '20');
      let dessertPricePerPiece = '';
      if (product.piece_price && Number(product.piece_price) > 0) {
        dessertPricePerPiece = String(product.piece_price);
      } else if (product.dessert_default_price && Number(dessertMinQty) > 0) {
        dessertPricePerPiece = String(Math.round((Number(product.dessert_default_price) / Number(dessertMinQty)) * 100) / 100);
      } else if (product.base_price) {
        dessertPricePerPiece = String(product.base_price);
      }

      setFormData({
        name: product.name,
        sku: product.sku || '',
        category_id: product.category_id,
        subcategory_id: product.subcategory_id || '',
        base_price: product.base_price,
        discount_price: product.discount_price || '',
        weight: isDessertProduct
          ? `${dessertMinQty} Pcs`
          : (product.weight || '500g'),
        portion_type: isDessertProduct
          ? 'portion'
          : (product.portion_type || (product.weight && ((product.weight.toLowerCase().includes('piece') || product.weight.toLowerCase().includes('slice') || product.weight.toLowerCase().includes('portion') || product.weight.toLowerCase().includes('pcs')) && (product.weight.toLowerCase().includes('g') || product.weight.toLowerCase().includes('kg'))) ? 'both' : (product.weight && (product.weight.toLowerCase().includes('piece') || product.weight.toLowerCase().includes('slice') || product.weight.toLowerCase().includes('portion'))) ? 'portion' : 'weight')),
        portion_unit: isDessertProduct ? 'pieces' : (product.portion_unit || 'grams'),
        portion_step: isDessertProduct ? dessertStep : (product.portion_step || '500g'),
        piece_price: isDessertProduct ? dessertPricePerPiece : (product.piece_price ? String(product.piece_price) : ''),
        piece_limit: dessertMax,
        piece_min: dessertMinQty,
        is_unlimited_pieces: product.piece_limit === 0 || product.piece_limit === null,
        short_description: product.short_description || '',
        description: product.description || '',
        is_eggless: !!product.is_eggless,
        is_available: !!product.is_available,
        is_featured: !!product.is_featured,
        is_popular: !!product.is_popular,
        is_new_arrival: !!product.is_new_arrival,
        is_gifting: !!product.is_gifting,
        image_url: product.image_url || '',
        variants: product.variants?.map((v) => ({
          size_weight: v.size_weight,
          price: v.price,
          discount_price: v.discount_price || '',
        })) || [],
        shapes: mergedShapes,
        enable_cupcake_matrix: hasExistingMatrix || isCupcakeProduct,
        cupcake_variants: product.cupcake_variants || defaultCupcakeVariants,
        enable_snack_matrix: isSnackProduct || Boolean(product.snack_variants),
        snack_variants: product.snack_variants || defaultSnackVariants,
        theme_cake_default_weight: product.theme_cake_default_weight !== null && product.theme_cake_default_weight !== undefined
          ? String(product.theme_cake_default_weight)
          : (isThemeProduct ? '5' : ''),
        theme_cake_default_price: product.theme_cake_default_price !== null && product.theme_cake_default_price !== undefined
          ? String(product.theme_cake_default_price)
          : (isThemeProduct ? String(product.base_price || 2000) : ''),
        theme_cake_step_size: product.theme_cake_step_size !== null && product.theme_cake_step_size !== undefined
          ? String(product.theme_cake_step_size)
          : '1',
        theme_cake_price_tiers: parsedTiers,
        dessert_min_quantity: dessertMinQty,
        dessert_default_price: product.dessert_default_price !== null && product.dessert_default_price !== undefined
          ? String(product.dessert_default_price)
          : (isDessertProduct ? String(Number(dessertPricePerPiece || 50) * Number(dessertMinQty || 1)) : ''),
        dessert_step_size: dessertStep,
        dessert_price_tiers: parsedDessertTiers,
        dry_fruit_pack_options: parsedDryFruitPacks,
        chocolate_pack_options: parsedChocolatePacks,
        chocolate_pricing_type: product.chocolate_pricing_type || (parsedChocolatePacks.length > 0 ? 'weight' : (product.sell_by_pieces ? 'piece' : 'weight')),
        sell_by_kg: product.sell_by_kg !== null && product.sell_by_kg !== undefined ? Boolean(product.sell_by_kg) : true,
        kg_step: product.kg_step !== null && product.kg_step !== undefined ? String(product.kg_step) : '0.5',
        kg_default: product.kg_default !== null && product.kg_default !== undefined ? String(product.kg_default) : '0.5',
        kg_max: product.kg_max !== null && product.kg_max !== undefined ? String(product.kg_max) : '10',
        kg_price: product.kg_price !== null && product.kg_price !== undefined ? String(product.kg_price) : (product.base_price ? String(product.base_price) : ''),
        sell_by_pieces: product.sell_by_pieces !== null && product.sell_by_pieces !== undefined ? Boolean(product.sell_by_pieces) : false,
        piece_default: product.piece_default !== null && product.piece_default !== undefined ? String(product.piece_default) : '1',
        piece_step: product.piece_step !== null && product.piece_step !== undefined ? String(product.piece_step) : '1',
        piece_max: product.piece_max !== null && product.piece_max !== undefined ? String(product.piece_max) : '20',
        enable_fixed_weight_pricing: Boolean(product.enable_fixed_weight_pricing),
        fixed_weight_options: parsedFixedWeightOptions,
      });
    setNewCreamInput('');
    setNewEggInput('');
    setImageMode('gallery');
    setModalOpen(true);
  };

  const handleAddShape = () => {
    setFormData((prev) => ({
      ...prev,
      shapes: [
        ...(prev.shapes || []),
        {
          id: `shape_${Date.now()}`,
          shape: 'Custom',
          name: 'Custom Shape',
          egg_price: '',
          eggless_price: '',
          image: '',
          is_active: true,
        },
      ],
    }));
  };

  const handleRemoveShape = (index) => {
    const shapeName = formData.shapes?.[index]?.name || formData.shapes?.[index]?.shape || 'this shape';
    if (window.confirm(`Are you sure you want to delete "${shapeName}"? This will remove both its Egg and Eggless prices.`)) {
      setFormData((prev) => {
        const nextShapes = (prev.shapes || []).filter((_, i) => i !== index);
        return { ...prev, shapes: nextShapes };
      });
      showToast(`Shape "${shapeName}" removed.`, 'info');
    }
  };

  const handleUpdateShape = (index, field, value) => {
    setFormData((prev) => {
      const nextShapes = [...(prev.shapes || DEFAULT_CAKE_SHAPES)];
      nextShapes[index] = { ...nextShapes[index], [field]: value };
      return { ...prev, shapes: nextShapes };
    });
  };

  const handleShapeImageUpload = async (index, file) => {
    if (!file) return;
    const payload = new FormData();
    payload.append('image', file);
    payload.append('folder', 'products/shapes');
    setUploadingShapeIndex(index);
    try {
      const res = await api.post('/admin/media/upload', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url;
      if (url) {
        setFormData((prev) => {
          const nextShapes = [...(prev.shapes || DEFAULT_CAKE_SHAPES)];
          nextShapes[index] = { ...nextShapes[index], image: url };
          return { ...prev, shapes: nextShapes };
        });
        showToast('Shape photo uploaded successfully!', 'success');
      }
    } catch (err) {
      showToast('Failed to upload shape image.', 'error');
    } finally {
      setUploadingShapeIndex(null);
    }
  };

  const handleAddCreamOption = () => {
    const name = newCreamInput.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const existing = formData.cupcake_variants?.cream_options || [];
    if (existing.some((c) => c.id === id)) {
      showToast('A cream option with this name already exists.', 'warning');
      return;
    }
    const updatedCream = [...existing, { id, name }];
    const eggOpts = formData.cupcake_variants?.egg_options || [];
    const currentMatrix = formData.cupcake_variants?.matrix || [];
    const newCombinations = eggOpts.map((egg) => ({
      cream_id: id,
      egg_id: egg.id,
      price: formData.base_price || '50',
      is_available: true,
    }));
    setFormData((prev) => ({
      ...prev,
      cupcake_variants: {
        ...prev.cupcake_variants,
        cream_options: updatedCream,
        matrix: [...currentMatrix, ...newCombinations],
      },
    }));
    setNewCreamInput('');
  };

  const handleRemoveCreamOption = (creamId) => {
    const updatedCream = (formData.cupcake_variants?.cream_options || []).filter((c) => c.id !== creamId);
    const updatedMatrix = (formData.cupcake_variants?.matrix || []).filter((m) => m.cream_id !== creamId);
    setFormData((prev) => ({
      ...prev,
      cupcake_variants: {
        ...prev.cupcake_variants,
        cream_options: updatedCream,
        matrix: updatedMatrix,
      },
    }));
  };

  const handleAddEggOption = () => {
    const name = newEggInput.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const existing = formData.cupcake_variants?.egg_options || [];
    if (existing.some((e) => e.id === id)) {
      showToast('An egg option with this name already exists.', 'warning');
      return;
    }
    const updatedEgg = [
      ...existing,
      {
        id,
        name,
        badge: name.toLowerCase().includes('eggless') || name.toLowerCase().includes('veg') ? 'Veg' : 'Classic',
      },
    ];
    const creamOpts = formData.cupcake_variants?.cream_options || [];
    const currentMatrix = formData.cupcake_variants?.matrix || [];
    const newCombinations = creamOpts.map((cream) => ({
      cream_id: cream.id,
      egg_id: id,
      price: formData.base_price || '50',
      is_available: true,
    }));
    setFormData((prev) => ({
      ...prev,
      cupcake_variants: {
        ...prev.cupcake_variants,
        egg_options: updatedEgg,
        matrix: [...currentMatrix, ...newCombinations],
      },
    }));
    setNewEggInput('');
  };

  const handleRemoveEggOption = (eggId) => {
    const updatedEgg = (formData.cupcake_variants?.egg_options || []).filter((e) => e.id !== eggId);
    const updatedMatrix = (formData.cupcake_variants?.matrix || []).filter((m) => m.egg_id !== eggId);
    setFormData((prev) => ({
      ...prev,
      cupcake_variants: {
        ...prev.cupcake_variants,
        egg_options: updatedEgg,
        matrix: updatedMatrix,
      },
    }));
  };

  const handleUpdateMatrixPrice = (creamId, eggId, price) => {
    const updatedMatrix = (formData.cupcake_variants?.matrix || []).map((m) => {
      if (m.cream_id === creamId && m.egg_id === eggId) {
        return { ...m, price };
      }
      return m;
    });
    setFormData((prev) => ({
      ...prev,
      cupcake_variants: {
        ...prev.cupcake_variants,
        matrix: updatedMatrix,
      },
    }));
  };

  const handleToggleMatrixAvailability = (creamId, eggId) => {
    const updatedMatrix = (formData.cupcake_variants?.matrix || []).map((m) => {
      if (m.cream_id === creamId && m.egg_id === eggId) {
        return { ...m, is_available: !m.is_available };
      }
      return m;
    });
    setFormData((prev) => ({
      ...prev,
      cupcake_variants: {
        ...prev.cupcake_variants,
        matrix: updatedMatrix,
      },
    }));
  };

  // Upload local image from device gallery
  const handleLocalImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (15MB)
    if (file.size > 15 * 1024 * 1024) {
      showToast('Image file size must be less than 15MB', 'error');
      return;
    }

    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, image_url: localPreview }));

    const uploadPayload = new FormData();
    uploadPayload.append('image', file);
    uploadPayload.append('folder', 'products');

    setUploadingImage(true);
    try {
      const res = await api.post('/admin/media/upload', uploadPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.data?.url) {
        setFormData((prev) => ({ ...prev, image_url: res.data.data.url }));
        setUploadSuccessName(`${file.name} (${res.data.data.size_kb} KB)`);
        showToast('Image uploaded successfully from local gallery!', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to upload image to server.', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddThemeTier = () => {
    const currentTiers = formData.theme_cake_price_tiers || [];
    const defWeight = Number(formData.theme_cake_default_weight || 5);
    const stepSize = Number(formData.theme_cake_step_size || 1);
    const nextWeight = currentTiers.length > 0
      ? Number(currentTiers[currentTiers.length - 1].weight || defWeight) + stepSize
      : defWeight + stepSize;
    const defPrice = Number(formData.theme_cake_default_price || formData.base_price || 2000);
    const estimatedPrice = Math.round((defPrice / defWeight) * nextWeight);

    setFormData((prev) => ({
      ...prev,
      theme_cake_price_tiers: [
        ...(prev.theme_cake_price_tiers || []),
        { weight: nextWeight, price: estimatedPrice },
      ],
    }));
  };

  const handleUpdateThemeTier = (index, field, value) => {
    const updated = [...(formData.theme_cake_price_tiers || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, theme_cake_price_tiers: updated }));
  };

  const handleRemoveThemeTier = (index) => {
    const updated = (formData.theme_cake_price_tiers || []).filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, theme_cake_price_tiers: updated }));
  };

  const handleAddDessertTier = () => {
    const currentTiers = formData.dessert_price_tiers || [];
    const minQty = Math.max(1, parseInt(formData.dessert_min_quantity || 2, 10));
    const nextQty = currentTiers.length > 0
      ? parseInt(currentTiers[currentTiers.length - 1].quantity || minQty, 10) + 1
      : minQty + 1;
    const defPrice = Number(formData.dessert_default_price || formData.base_price || 100);
    const estimatedPrice = Math.round((defPrice / minQty) * nextQty);

    setFormData((prev) => ({
      ...prev,
      dessert_price_tiers: [
        ...(prev.dessert_price_tiers || []),
        { quantity: nextQty, price: estimatedPrice },
      ],
    }));
  };

  const handleUpdateDessertTier = (index, field, value) => {
    const updated = [...(formData.dessert_price_tiers || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, dessert_price_tiers: updated }));
  };

  const handleRemoveDessertTier = (index) => {
    const updated = (formData.dessert_price_tiers || []).filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, dessert_price_tiers: updated }));
  };

  const handleAddDryFruitPack = () => {
    const currentPacks = formData.dry_fruit_pack_options || [];
    let nextWeight = 200;
    let nextUnit = 'g';
    let nextPrice = 150;
    if (currentPacks.length > 0) {
      const last = currentPacks[currentPacks.length - 1];
      if (last.unit === 'g') {
        if (Number(last.weight) < 500) {
          nextWeight = 500;
          nextUnit = 'g';
          nextPrice = Math.round(Number(last.price || 150) * 2.2);
        } else {
          nextWeight = 1;
          nextUnit = 'kg';
          nextPrice = Math.round(Number(last.price || 350) * 1.9);
        }
      } else {
        nextWeight = Number(last.weight) + 1;
        nextUnit = 'kg';
        nextPrice = Math.round(Number(last.price || 650) * (nextWeight / Math.max(1, Number(last.weight))));
      }
    }
    setFormData((prev) => ({
      ...prev,
      dry_fruit_pack_options: [
        ...(prev.dry_fruit_pack_options || []),
        { weight: nextWeight, unit: nextUnit, price: nextPrice },
      ],
    }));
  };

  const handleUpdateDryFruitPack = (index, field, value) => {
    const updated = [...(formData.dry_fruit_pack_options || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, dry_fruit_pack_options: updated }));
  };

  const handleRemoveDryFruitPack = (index) => {
    const updated = (formData.dry_fruit_pack_options || []).filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, dry_fruit_pack_options: updated }));
  };

  const handleAddChocolatePack = () => {
    const currentPacks = formData.chocolate_pack_options || [];
    let nextWeight = 100;
    let nextUnit = 'g';
    let nextPrice = 120;
    if (currentPacks.length > 0) {
      const last = currentPacks[currentPacks.length - 1];
      if (last.unit === 'g') {
        if (Number(last.weight) < 250) {
          nextWeight = 250;
          nextUnit = 'g';
          nextPrice = Math.round(Number(last.price || 120) * 2.3);
        } else if (Number(last.weight) < 500) {
          nextWeight = 500;
          nextUnit = 'g';
          nextPrice = Math.round(Number(last.price || 250) * 1.9);
        } else {
          nextWeight = 1;
          nextUnit = 'kg';
          nextPrice = Math.round(Number(last.price || 450) * 1.9);
        }
      } else {
        nextWeight = Number(last.weight) + 1;
        nextUnit = 'kg';
        nextPrice = Math.round(Number(last.price || 850) * (nextWeight / Math.max(1, Number(last.weight))));
      }
    }
    setFormData((prev) => ({
      ...prev,
      chocolate_pack_options: [
        ...(prev.chocolate_pack_options || []),
        { weight: nextWeight, unit: nextUnit, price: nextPrice },
      ],
    }));
  };

  const handleUpdateChocolatePack = (index, field, value) => {
    const updated = [...(formData.chocolate_pack_options || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, chocolate_pack_options: updated }));
  };

  const handleRemoveChocolatePack = (index) => {
    const updated = (formData.chocolate_pack_options || []).filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, chocolate_pack_options: updated }));
  };

  const handleAddFixedWeightOption = () => {
    const current = formData.fixed_weight_options || [];
    let nextNum = 1;
    let nextPrice = 500;
    if (current.length > 0) {
      const last = current[current.length - 1];
      const match = String(last.weight || '').match(/^(\d+(?:\.\d+)?)/);
      if (match) {
        nextNum = Number(match[1]) + 1;
      } else {
        nextNum = current.length + 1;
      }
      const lastPrice = Number(last.price) || 500;
      nextPrice = Math.round(lastPrice * (nextNum / Math.max(1, nextNum - 1)) * 0.95);
    }
    setFormData((prev) => ({
      ...prev,
      fixed_weight_options: [
        ...(prev.fixed_weight_options || []),
        { weight: `${nextNum} kg`, price: nextPrice },
      ],
    }));
  };

  const handleUpdateFixedWeightOption = (index, field, value) => {
    const updated = [...(formData.fixed_weight_options || [])];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, fixed_weight_options: updated }));
  };

  const handleRemoveFixedWeightOption = (index) => {
    const updated = (formData.fixed_weight_options || []).filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, fixed_weight_options: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const isTheme = Boolean(
        selectedCategoryObj?.slug === 'theme-cakes' ||
        selectedCategoryObj?.name?.toLowerCase().includes('theme cake') ||
        String(formData.category_id) === '8'
      );
      const isDessert = Boolean(
        selectedCategoryObj?.slug === 'dessert' ||
        selectedCategoryObj?.name?.toLowerCase().includes('dessert') ||
        String(formData.category_id) === '3'
      );
      const isDryFruit = Boolean(
        selectedCategoryObj?.slug === 'dry-fruits' ||
        selectedCategoryObj?.name?.toLowerCase().includes('dry fruit') ||
        String(formData.category_id) === '4'
      );
      const isChocolates = Boolean(
        selectedCategoryObj?.slug === 'chocolates' ||
        selectedCategoryObj?.name?.toLowerCase().includes('chocolate') ||
        String(formData.category_id) === '5'
      );
      const isCakesAndPastries = Boolean(
        selectedCategoryObj?.slug === 'cakes-pastries' ||
        selectedCategoryObj?.name?.toLowerCase().includes('cakes & pastries') ||
        selectedCategoryObj?.name?.toLowerCase().includes('cakes and pastries') ||
        String(formData.category_id) === '1'
      );
      const isSweets = Boolean(
        selectedCategoryObj?.slug === 'sweets' ||
        selectedCategoryObj?.name?.toLowerCase().includes('sweet') ||
        String(formData.category_id) === '9'
      );
      const isCakesOrSweets = isCakesAndPastries || isSweets;

      if (isCakesOrSweets) {
        if (!formData.sell_by_kg && !formData.sell_by_pieces) {
          showToast(`Please enable at least one sale option: Sell by kg or Sell by pieces for this ${isSweets ? 'sweet' : 'cake'}.`, 'warning');
          return;
        }

        if (formData.sell_by_kg) {
          const kgStep = Number(formData.kg_step);
          const kgDefault = Number(formData.kg_default);
          const kgMax = Number(formData.kg_max);
          const kgPrice = Number(formData.kg_price);

          if (!kgPrice || kgPrice <= 0) {
            showToast('Price per kg must be greater than 0.', 'warning');
            return;
          }
          if (!kgDefault || kgDefault <= 0) {
            showToast('Default kg must be greater than 0.', 'warning');
            return;
          }
          if (kgDefault > kgMax) {
            showToast('Default kg cannot be greater than maximum kg.', 'warning');
            return;
          }
          const stepInt = Math.round(kgStep * 10);
          const defInt = Math.round(kgDefault * 10);
          if (stepInt > 0 && defInt % stepInt !== 0) {
            showToast(`Default kg (${kgDefault}) must be a multiple of increment step (${kgStep} kg).`, 'warning');
            return;
          }
        }

        if (formData.sell_by_pieces) {
          const pieceDefault = parseInt(formData.piece_default, 10);
          const pieceStep = parseInt(formData.piece_step, 10);
          const pieceMax = parseInt(formData.piece_max, 10);
          const piecePrice = Number(formData.piece_price);

          if (!piecePrice || piecePrice <= 0) {
            showToast('Price per piece must be greater than 0.', 'warning');
            return;
          }
          if (!pieceDefault || pieceDefault < 1) {
            showToast('Default pieces must be at least 1.', 'warning');
            return;
          }
          if (!pieceStep || pieceStep < 1) {
            showToast('Increment step for pieces must be at least 1.', 'warning');
            return;
          }
          if (pieceDefault > pieceMax) {
            showToast('Default pieces cannot be greater than maximum pieces.', 'warning');
            return;
          }
          if (pieceDefault % pieceStep !== 0) {
            showToast(`Default pieces (${pieceDefault}) must be a multiple of increment step (${pieceStep}).`, 'warning');
            return;
          }
        }

        if (formData.enable_fixed_weight_pricing) {
          const validFixed = (formData.fixed_weight_options || []).filter(
            (o) => String(o.weight || '').trim() !== '' && Number(o.price) > 0
          );
          if (validFixed.length === 0) {
            showToast('Please add at least one fixed weight option with a valid price (e.g. 1 kg → ₹500).', 'warning');
            return;
          }
        }
      }

      const payload = {
        ...formData,
        piece_price: formData.piece_price ? Number(formData.piece_price) : null,
        piece_limit: formData.is_unlimited_pieces ? 0 : (formData.piece_limit ? Number(formData.piece_limit) : 20),
        piece_min: formData.piece_min ? Number(formData.piece_min) : 1,
        cupcake_variants: formData.enable_cupcake_matrix ? formData.cupcake_variants : null,
        snack_variants: formData.enable_snack_matrix ? formData.snack_variants : null,
        theme_cake_default_weight: isTheme ? Number(formData.theme_cake_default_weight || 5) : null,
        theme_cake_default_price: isTheme ? Number(formData.theme_cake_default_price || formData.base_price || 2000) : null,
        theme_cake_step_size: isTheme ? Number(formData.theme_cake_step_size || 1) : null,
        theme_cake_price_tiers: isTheme ? (formData.theme_cake_price_tiers || []) : null,
        dessert_min_quantity: isDessert ? Math.max(1, parseInt(formData.dessert_min_quantity || 1, 10)) : null,
        dessert_default_price: isDessert ? Number(formData.dessert_default_price || formData.base_price || 100) : null,
        dessert_step_size: 1,
        dessert_price_tiers: isDessert ? (formData.dessert_price_tiers || []) : null,
        dry_fruit_pack_options: isDryFruit ? (formData.dry_fruit_pack_options || []) : null,
        chocolate_pack_options: isChocolates ? (formData.chocolate_pack_options || []) : null,
        chocolate_pricing_type: isChocolates ? (formData.chocolate_pricing_type || 'weight') : null,
        sell_by_kg: isCakesOrSweets ? Boolean(formData.sell_by_kg) : false,
        kg_step: isCakesOrSweets && formData.sell_by_kg ? Number(formData.kg_step) : null,
        kg_default: isCakesOrSweets && formData.sell_by_kg ? Number(formData.kg_default) : null,
        kg_max: isCakesOrSweets && formData.sell_by_kg ? Number(formData.kg_max) : null,
        kg_price: isCakesOrSweets && formData.sell_by_kg ? Number(formData.kg_price) : null,
        sell_by_pieces: isCakesOrSweets ? Boolean(formData.sell_by_pieces) : false,
        piece_default: isCakesOrSweets && formData.sell_by_pieces ? parseInt(formData.piece_default, 10) : null,
        piece_step: isCakesOrSweets && formData.sell_by_pieces ? parseInt(formData.piece_step, 10) : null,
        piece_max: isCakesOrSweets && formData.sell_by_pieces ? parseInt(formData.piece_max, 10) : null,
        enable_fixed_weight_pricing: isCakesOrSweets ? Boolean(formData.enable_fixed_weight_pricing) : false,
        fixed_weight_options: isCakesOrSweets && formData.enable_fixed_weight_pricing ? (formData.fixed_weight_options || []) : [],
        shapes: isCakesAndPastries && Array.isArray(formData.shapes) ? formData.shapes : null,
      };

      if (isCakesOrSweets) {
        if (formData.sell_by_kg) {
          payload.base_price = Number(formData.kg_price);
          payload.weight = `${formData.kg_default}kg`;
          payload.portion_type = formData.sell_by_pieces ? 'both' : 'weight';
          payload.portion_unit = formData.sell_by_pieces ? 'both' : 'kg';
        } else if (formData.sell_by_pieces) {
          payload.base_price = Number(formData.piece_price);
          payload.weight = `${formData.piece_default} Pcs`;
          payload.portion_type = 'portion';
          payload.portion_unit = 'pieces';
        }
        if (formData.enable_fixed_weight_pricing && formData.fixed_weight_options?.length > 0) {
          const firstOpt = formData.fixed_weight_options[0];
          if (firstOpt?.price) {
            payload.base_price = Number(firstOpt.price);
          }
          if (firstOpt?.weight) {
            payload.weight = firstOpt.weight;
          }
        }
      }

      if (isTheme) {
        payload.base_price = payload.theme_cake_default_price || formData.base_price || 2000;
        payload.weight = `${payload.theme_cake_default_weight || 5}kg`;
      }
      if (isDessert) {
        const unitPrice = Number(formData.piece_price || formData.dessert_default_price || formData.base_price || 0);
        const defaultPieces = Math.max(1, parseInt(formData.dessert_min_quantity || 1, 10));
        const stepPieces = Math.max(1, parseInt(formData.dessert_step_size || 1, 10));
        const maxPieces = Math.max(defaultPieces, parseInt(formData.piece_limit || 20, 10));

        if (!unitPrice || unitPrice <= 0) {
          showToast('Price per piece must be greater than 0.', 'warning');
          return;
        }
        if (parseInt(formData.piece_limit, 10) < defaultPieces) {
          showToast('Maximum pieces limit cannot be less than default starting pieces.', 'warning');
          return;
        }

        payload.piece_price = unitPrice;
        payload.dessert_min_quantity = defaultPieces;
        payload.dessert_step_size = stepPieces;
        payload.piece_default = defaultPieces;
        payload.piece_step = stepPieces;
        payload.piece_limit = maxPieces;
        payload.piece_max = maxPieces;
        payload.piece_min = defaultPieces;
        payload.dessert_default_price = Math.round(unitPrice * defaultPieces);
        payload.base_price = payload.dessert_default_price;
        payload.weight = `${defaultPieces} Pcs`;
        payload.portion_type = 'portion';
        payload.portion_unit = 'pieces';
        payload.portion_step = String(stepPieces);
      }
      if (isDryFruit) {
        const rawPacks = formData.dry_fruit_pack_options || [];
        const validPacks = rawPacks.filter((p) => Number(p.weight) > 0 && Number(p.price) > 0);
        if (validPacks.length === 0) {
          showToast('Please add at least one valid pack option (weight, unit, price) for Dry Fruits.', 'warning');
          return;
        }
        const formattedPacks = validPacks.map((p) => {
          const unit = String(p.unit || 'g').toLowerCase() === 'kg' ? 'kg' : 'g';
          const weight = Number(p.weight);
          return {
            weight,
            unit,
            label: `${weight}${unit}`,
            price: Number(p.price),
          };
        });
        formattedPacks.sort((a, b) => {
          const aGrams = a.unit === 'kg' ? a.weight * 1000 : a.weight;
          const bGrams = b.unit === 'kg' ? b.weight * 1000 : b.weight;
          return aGrams - bGrams;
        });

        payload.dry_fruit_pack_options = formattedPacks;
        payload.base_price = formattedPacks[0].price;
        payload.weight = formattedPacks[0].label;
      }
      if (editingId) {
        await api.put(`/admin/products/${editingId}`, payload);
        showToast('Product updated successfully!', 'success');
      } else {
        await api.post('/admin/products', payload);
        showToast('New product created successfully!', 'success');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      showToast(err.friendlyMessage || 'Failed to save product.', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await api.delete(`/admin/products/${id}`);
      showToast(`Deleted "${name}".`, 'info');
      fetchProducts();
    } catch (err) {
      showToast('Unable to delete product.', 'error');
    }
  };

  const handleToggle = async (id, field) => {
    try {
      await api.post(`/admin/products/${id}/toggle-field`, { field });
      fetchProducts();
      showToast('Status updated.', 'success');
    } catch (err) {
      showToast('Toggle failed.', 'error');
    }
  };

  // Bulk CSV Export of all products
  const handleExportCsv = async () => {
    try {
      setExportingCsv(true);
      const res = await api.get('/admin/products/export-csv', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Ammas_Pastries_Products_Export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('All website products exported to CSV successfully!', 'success');
    } catch (err) {
      console.error('CSV export failed:', err);
      showToast('Failed to export products to CSV.', 'error');
    } finally {
      setExportingCsv(false);
    }
  };

  // Download blank / sample CSV template
  const handleDownloadTemplate = async () => {
    try {
      const res = await api.get('/admin/products/csv-template', {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Ammas_Pastries_Products_Bulk_Template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Sample template downloaded.', 'success');
    } catch (err) {
      console.error('Template download failed:', err);
      showToast('Failed to download template.', 'error');
    }
  };

  // Handle CSV file selection and quick preview
  const handleCsvFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv') && !file.name.toLowerCase().endsWith('.txt')) {
      showToast('Please select a valid .csv file.', 'error');
      return;
    }

    setImportFile(file);
    setImportResult(null);

    // Read quick preview (first 5 lines)
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split(/\r\n|\n/).filter((l) => l.trim() !== '');
      if (lines.length > 0) {
        const preview = lines.slice(0, 5).map((l) => {
          return l.split(',').map((item) => item.replace(/^"|"$/g, '').trim());
        });
        setCsvPreviewRows(preview);
      }
    };
    reader.readAsText(file);
  };

  // Upload and process CSV
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!importFile) {
      showToast('Please select a CSV file first.', 'error');
      return;
    }

    try {
      setImporting(true);
      setImportResult(null);

      const formDataObj = new FormData();
      formDataObj.append('file', importFile);

      const res = await api.post('/admin/products/bulk-upload', formDataObj, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setImportResult(res.data.data);
        showToast(res.data.message || 'Bulk update completed!', 'success');
        fetchProducts(); // Refresh live table
      } else {
        showToast(res.data?.message || 'Bulk upload failed.', 'error');
      }
    } catch (err) {
      console.error('Bulk upload error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Bulk upload failed.';
      showToast(errMsg, 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleOpenBulkModal = () => {
    setImportFile(null);
    setImportResult(null);
    setCsvPreviewRows([]);
    setBulkModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-chocolate">Bakery Products & Cakes</h1>
          <p className="text-xs text-slate-500">
            Manage signature cakes, pastries, varieties, variants, pricing, and bulk CSV updates across the website
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Export CSV Button */}
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="inline-flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-2xs"
            title="Download full CSV list of all products to view or edit in Excel"
          >
            {exportingCsv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Export CSV</span>
          </button>

          {/* Bulk CSV Import / Update Button */}
          <button
            onClick={handleOpenBulkModal}
            className="inline-flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-2xs"
            title="Upload CSV/Excel file to add or update products in bulk"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Bulk CSV Import</span>
          </button>

          {/* Add Cake Button */}
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Cake</span>
          </button>
        </div>
      </div>

      {/* Bulk CSV / Excel Management Action Banner */}
      <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50/60 rounded-3xl p-4 sm:p-5 border border-amber-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-xs flex-shrink-0">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="font-serif font-bold text-sm text-chocolate flex items-center gap-2">
              <span>Bulk Excel / CSV Catalog Manager</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full">
                Add & Update Everything
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
              Export all products to Excel, update prices, descriptions, variants & images, or add new products via spreadsheet.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={handleExportCsv}
            disabled={exportingCsv}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            {exportingCsv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Export Live CSV</span>
          </button>
          <button
            onClick={handleOpenBulkModal}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload CSV & Update</span>
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer"
            title="Download empty CSV template"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
            <span>Sample Template</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search product name or SKU..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCat}
            onChange={(e) => {
              setSelectedCat(e.target.value);
              setSelectedSubcat('');
              setCurrentPage(1);
            }}
            className="text-xs p-2 rounded-xl border border-slate-200 font-medium text-chocolate focus:outline-none cursor-pointer"
          >
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Subcategory Filter (if category selected) */}
          {filterSubcategories.length > 0 && (
            <select
              value={selectedSubcat}
              onChange={(e) => {
                setSelectedSubcat(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs p-2 rounded-xl border border-amber-300 bg-amber-50/50 font-medium text-amber-900 focus:outline-none cursor-pointer"
            >
              <option value="">All Varieties / Subcategories</option>
              {filterSubcategories.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          )}

          {/* Dietary Filter in Admin */}
          <select
            value={dietFilter}
            onChange={(e) => {
              setDietFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs p-2 rounded-xl border border-slate-200 font-medium text-chocolate focus:outline-none cursor-pointer"
          >
            <option value="">All Diet Types</option>
            <option value="true">🌱 100% Eggless</option>
            <option value="false">🥚 With Egg</option>
          </select>

          {/* Stock Availability Filter */}
          <select
            value={stockFilter}
            onChange={(e) => {
              setStockFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs p-2 rounded-xl border border-slate-200 font-medium text-chocolate focus:outline-none cursor-pointer"
          >
            <option value="">All Stock Status</option>
            <option value="in_stock">✅ In Stock</option>
            <option value="out_of_stock">⚠️ Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Active Section Filter Banner */}
      {(selectedCat || stockFilter || selectedSubcat || dietFilter || search) && (
        <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-chocolate shadow-2xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-amber-900">Active Filters:</span>
            {selectedCat && (
              <span className="bg-white border border-amber-300 text-amber-900 font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                Category: {categories.find((c) => String(c.id) === String(selectedCat))?.name || 'Selected Category'}
              </span>
            )}
            {selectedSubcat && (
              <span className="bg-white border border-amber-300 text-amber-900 font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                Variety: {filterSubcategories.find((s) => String(s.id) === String(selectedSubcat))?.name || selectedSubcat}
              </span>
            )}
            {search && (
              <span className="bg-white border border-amber-300 text-amber-900 font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                Search: "{search}"
              </span>
            )}
            {stockFilter && (
              <span className="bg-white border border-amber-300 text-amber-900 font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                Status: {stockFilter === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}
              </span>
            )}
            {dietFilter && (
              <span className="bg-white border border-amber-300 text-amber-900 font-bold px-2.5 py-1 rounded-lg shadow-2xs">
                Diet: {dietFilter === 'true' ? '100% Eggless' : 'With Egg'}
              </span>
            )}
            <span className="text-slate-500 font-semibold">({pagination.total} products)</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCat('');
              setSelectedSubcat('');
              setStockFilter('');
              setDietFilter('');
              setSearch('');
              setCurrentPage(1);
              navigate('/admin/products');
            }}
            className="text-xs font-bold text-amber-900 hover:text-rose-600 bg-white border border-amber-300 hover:border-rose-300 px-3 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer shrink-0"
          >
            Clear / Show All
          </button>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="p-4">Product</th>
                <th className="p-4">Category & Variety</th>
                <th className="p-4">Base Price</th>
                <th className="p-4">Variants</th>
                <th className="p-4 text-center">Available</th>
                <th className="p-4 text-center">Bestseller</th>
                <th className="p-4 text-center">New</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">Loading products...</td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={formatImageUrl(p.image_url, 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100')}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover border border-amber-100 flex-shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100';
                          }}
                        />
                        <div>
                          <div className="font-bold text-chocolate text-sm leading-snug">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>SKU: {p.sku || 'N/A'}</span>
                            <span className={`px-1.5 py-0.2 rounded font-sans font-bold text-[10px] ${
                              p.is_eggless
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}>
                              {p.is_eggless ? '🌱 Eggless' : '🥚 With Egg'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-chocolate">{p.category?.name || 'General'}</div>
                      {p.subcategory ? (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {p.subcategory.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Regular</span>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-chocolate text-sm">₹{p.base_price}</div>
                      {p.discount_price && (
                        <div className="text-[10px] text-emerald-600 font-semibold">
                          Special: ₹{p.discount_price}
                        </div>
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md w-max ${
                          p.portion_type === 'both'
                            ? 'bg-teal-100 text-teal-800 border border-teal-200'
                            : p.portion_type === 'portion'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-amber-100 text-amber-900 border border-amber-200'
                        }`}>
                          {p.portion_type === 'both' ? '🎂 Both (Grams & Pcs)' : p.portion_type === 'portion' ? '🍰 By Portion' : '⚖️ By Weight'}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {p.variants && p.variants.length > 0 ? (
                            p.variants.map((v) => (
                              <span key={v.id} className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-600 font-mono">
                                {v.size_weight}: ₹{v.price}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 text-[10px]">{p.weight || '1 variant'}</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggle(p.id, 'is_available')}
                        className={`w-7 h-7 rounded-full inline-flex items-center justify-center transition-colors ${
                          p.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'
                        }`}
                        title={p.is_available ? 'Available' : 'Unavailable'}
                      >
                        {p.is_available ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggle(p.id, 'is_popular')}
                        className={`w-7 h-7 rounded-full text-xs font-bold inline-flex items-center justify-center transition-colors ${
                          p.is_popular ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {p.is_popular ? '★' : '—'}
                      </button>
                    </td>

                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggle(p.id, 'is_new_arrival')}
                        className={`w-7 h-7 rounded-full text-xs font-bold inline-flex items-center justify-center transition-colors ${
                          p.is_new_arrival ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {p.is_new_arrival ? 'N' : '—'}
                      </button>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-amber-800 hover:bg-amber-50 rounded-lg"
                          title="Edit Cake"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2.5 max-w-md mx-auto py-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 text-xl shadow-2xs">
                        🍰
                      </div>
                      <div className="font-serif font-bold text-base text-chocolate">
                        {selectedCat ? 'No products in this category' : 'No products found'}
                      </div>
                      <p className="text-xs text-slate-500 max-w-sm">
                        {selectedCat
                          ? 'No products in this category match your current filter or search criteria.'
                          : 'Try changing your search query or removing filters to view all products.'}
                      </p>
                      {selectedCat && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCat('');
                            setSelectedSubcat('');
                            setCurrentPage(1);
                          }}
                          className="mt-1 text-xs font-bold text-amber-900 hover:text-white bg-amber-100/80 hover:bg-amber-600 border border-amber-300 px-3.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer"
                        >
                          Show All Products
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {pagination.total > 0 && pagination.last_page > 1 && (
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-medium">
            Showing <strong className="text-chocolate font-bold">{((pagination.current_page - 1) * pagination.per_page) + 1}</strong> to{' '}
            <strong className="text-chocolate font-bold">
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)}
            </strong> of{' '}
            <strong className="text-chocolate font-bold">{pagination.total}</strong> products
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-xs text-chocolate hover:bg-amber-50 hover:border-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              Previous
            </button>

            {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
              .filter((p) => {
                return p === 1 || p === pagination.last_page || Math.abs(p - currentPage) <= 1;
              })
              .map((pageNum, idx, arr) => {
                const prevPageNum = arr[idx - 1];
                const showEllipsis = prevPageNum && pageNum - prevPageNum > 1;
                return (
                  <React.Fragment key={pageNum}>
                    {showEllipsis && <span className="px-1 text-slate-400 font-bold">...</span>}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className={`w-8 h-8 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center ${
                        currentPage === pageNum
                          ? 'bg-chocolate text-white shadow-xs'
                          : 'border border-slate-200 text-slate-600 hover:bg-amber-50 hover:border-amber-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              type="button"
              disabled={currentPage >= pagination.last_page || loading}
              onClick={() => setCurrentPage((p) => Math.min(pagination.last_page, p + 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 font-bold text-xs text-chocolate hover:bg-amber-50 hover:border-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-5 border border-amber-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-serif font-bold text-xl text-chocolate">
                  {editingId ? 'Edit Bakery Product' : 'Add New Cake / Product'}
                </h2>
                <p className="text-[11px] text-slate-500">
                  Select category, specific cake variety, price, weight and upload image from device gallery or link.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product / Cake Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Belgian Chocolate Truffle"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. AMP-8472"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Main Category */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => {
                      const newCatId = e.target.value;
                      const catObj = categories.find((c) => String(c.id) === String(newCatId));
                      const isSnacks = Boolean(catObj?.slug === 'snacks' || catObj?.name?.toLowerCase() === 'snacks');
                      const isDry = Boolean(catObj?.slug === 'dry-fruits' || catObj?.name?.toLowerCase().includes('dry fruit') || String(newCatId) === '4');
                      const firstSub = catObj?.subcategories?.[0]?.id || '';
                      setFormData((prev) => ({
                        ...prev,
                        category_id: newCatId,
                        subcategory_id: firstSub,
                        enable_snack_matrix: isSnacks || prev.enable_snack_matrix,
                        dry_fruit_pack_options: isDry && (!prev.dry_fruit_pack_options || prev.dry_fruit_pack_options.length === 0)
                          ? [
                              { weight: 200, unit: 'g', price: 150 },
                              { weight: 500, unit: 'g', price: 350 },
                              { weight: 1, unit: 'kg', price: 650 },
                            ]
                          : prev.dry_fruit_pack_options,
                      }));
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subcategory / Varieties Selector */}
                <div>
                  <label className="block font-bold text-amber-900 mb-1 flex items-center justify-between">
                    <span>{isSweetsSelected ? 'Sweet Variety / Subcategory' : 'Cake Variety / Subcategory'}</span>
                    <span className="text-[10px] text-amber-600 font-normal">e.g. Exotic Fruitz, Mousse</span>
                  </label>
                  <select
                    value={formData.subcategory_id}
                    onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-amber-300 bg-amber-50/40 font-semibold text-amber-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">-- General (No Specific Variety) --</option>
                    {availableSubcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                    placeholder="499"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Price (₹, optional)</label>
                  <input
                    type="number"
                    value={formData.discount_price}
                    onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                    placeholder="450"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* THEME CAKE DYNAMIC BASE WEIGHT & PRICING RULES */}
                {isThemeCakeSelected && (
                  <div className="sm:col-span-2 p-4 sm:p-5 bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-amber-100/30 rounded-2xl border-2 border-amber-300 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-200">
                      <div className="flex items-center gap-2">
                        <Scale className="w-5 h-5 text-amber-700 shrink-0" />
                        <div>
                          <h3 className="font-serif font-bold text-sm sm:text-base text-chocolate flex items-center gap-2">
                            <span>Theme Cake Starting Weight &amp; Dynamic Pricing</span>
                            <span className="text-[10px] font-bold bg-amber-500 text-chocolate px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Theme Rule
                            </span>
                          </h3>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Customer weight selector starts strictly from this default weight (never 1kg) and increments upward.
                          </p>
                        </div>
                      </div>

                      {Number(formData.theme_cake_default_weight) > 0 && Number(formData.theme_cake_default_price || formData.base_price) > 0 && (
                        <div className="text-xs font-bold text-amber-900 bg-white/90 border border-amber-300 px-3 py-1.5 rounded-xl shadow-2xs shrink-0 self-start sm:self-auto">
                          Derived Rate: <span className="text-chocolate">₹{Math.round(Number(formData.theme_cake_default_price || formData.base_price) / Number(formData.theme_cake_default_weight))}/kg</span>
                        </div>
                      )}
                    </div>

                    {/* 3 Config Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-chocolate block">
                          Base Starting Weight (kg) *
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            required={isThemeCakeSelected}
                            value={formData.theme_cake_default_weight}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData({
                                ...formData,
                                theme_cake_default_weight: val,
                                weight: val ? `${val}kg` : formData.weight,
                              });
                            }}
                            className="w-full font-bold text-sm text-chocolate p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500"
                          />
                          <span className="text-xs font-bold text-slate-400">kg</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">Lowest selectable weight (e.g. 5kg)</span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-chocolate block">
                          Base Price for Default Weight (₹) *
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400">₹</span>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            required={isThemeCakeSelected}
                            value={formData.theme_cake_default_price}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormData({
                                ...formData,
                                theme_cake_default_price: val,
                                base_price: val || formData.base_price,
                              });
                            }}
                            className="w-full font-bold text-sm text-chocolate p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 block">Price for starting weight (e.g. ₹2000)</span>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-chocolate block">
                          Step Increment (kg)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0.5"
                            step="0.5"
                            value={formData.theme_cake_step_size}
                            onChange={(e) => setFormData({ ...formData, theme_cake_step_size: e.target.value })}
                            className="w-full font-bold text-sm text-chocolate p-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-amber-500"
                          />
                          <span className="text-xs font-bold text-slate-400">kg</span>
                        </div>
                        <span className="text-[10px] text-slate-400 block">Stepper step jump (default 1kg)</span>
                      </div>
                    </div>

                    {/* Custom Override Price Tiers Table */}
                    <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="text-xs font-bold text-chocolate block">
                            Custom Price Overrides Per Step (Optional)
                          </label>
                          <span className="text-[10px] text-slate-500">
                            By default, price scales proportionally based on base rate. Set custom prices below to override specific weights (e.g. 6kg = ₹2300).
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddThemeTier}
                          className="px-2.5 py-1 text-xs font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Step Override</span>
                        </button>
                      </div>

                      {formData.theme_cake_price_tiers && formData.theme_cake_price_tiers.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-amber-50/50 text-slate-600 font-bold border-b border-amber-100">
                              <tr>
                                <th className="py-2 px-3">Weight (kg)</th>
                                <th className="py-2 px-3">Custom Override Price (₹)</th>
                                <th className="py-2 px-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100">
                              {formData.theme_cake_price_tiers.map((tier, idx) => (
                                <tr key={idx} className="hover:bg-amber-50/20">
                                  <td className="py-2 px-3">
                                    <div className="flex items-center gap-1.5 w-28">
                                      <input
                                        type="number"
                                        step="0.5"
                                        min={Number(formData.theme_cake_default_weight || 1)}
                                        value={tier.weight}
                                        onChange={(e) => handleUpdateThemeTier(idx, 'weight', e.target.value)}
                                        className="w-full font-bold p-1 rounded border border-slate-200 text-xs"
                                      />
                                      <span className="text-slate-400 font-bold">kg</span>
                                    </div>
                                  </td>
                                  <td className="py-2 px-3">
                                    <div className="flex items-center gap-1.5 w-32">
                                      <span className="text-slate-400 font-bold">₹</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={tier.price}
                                        onChange={(e) => handleUpdateThemeTier(idx, 'price', e.target.value)}
                                        className="w-full font-bold p-1 rounded border border-slate-200 text-xs text-chocolate"
                                      />
                                    </div>
                                  </td>
                                  <td className="py-2 px-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveThemeTier(idx)}
                                      className="text-rose-500 hover:text-rose-700 font-bold p-1 hover:bg-rose-50 rounded"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100 text-[11px] text-amber-800">
                          ✨ No step overrides added. Weights will automatically scale proportionally: <em>{formData.theme_cake_default_weight || 5}kg = ₹{formData.theme_cake_default_price || formData.base_price || 2000}</em>, <em>{(Number(formData.theme_cake_default_weight || 5) + Number(formData.theme_cake_step_size || 1))}kg = ₹{Math.round((Number(formData.theme_cake_default_price || formData.base_price || 2000) / Number(formData.theme_cake_default_weight || 5)) * (Number(formData.theme_cake_default_weight || 5) + Number(formData.theme_cake_step_size || 1)))}</em>, etc.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* DESSERT DYNAMIC PIECE QUANTITY & PRICING RULES */}
                {isDessertSelected && (
                  <div className="sm:col-span-2 rounded-2xl border-2 border-rose-300 bg-rose-50/40 p-4 sm:p-5 transition-all shadow-sm space-y-4">
                    <div className="flex items-center justify-between gap-3 border-b border-rose-200/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🍮</span>
                          <h4 className="text-sm font-black text-chocolate">
                            Dessert Piece Quantity &amp; Dynamic Pricing
                          </h4>
                          <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-300">
                            Desserts Mode (Pieces Only — No Weight)
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Dessert products are strictly measured in <strong>Pieces</strong>. Customers start from the minimum piece count and can only scale up in 1-piece steps.
                        </p>
                      </div>
                    </div>

                    {/* Core Inputs: Price per piece, Default pieces, Increment step, Maximum limit */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Price per Piece (₹) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="any"
                          required={isDessertSelected}
                          value={formData.piece_price}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormData((prev) => {
                              const minQ = Number(prev.dessert_min_quantity || 1);
                              const totalDef = val && !isNaN(Number(val)) ? Math.round(Number(val) * minQ) : prev.dessert_default_price;
                              return {
                                ...prev,
                                piece_price: val,
                                dessert_default_price: totalDef,
                                base_price: totalDef || val,
                              };
                            });
                          }}
                          placeholder="e.g. 50"
                          className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 font-mono"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          The price per piece (e.g. ₹50).
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Default (Starting) Pieces *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required={isDessertSelected}
                          value={formData.dessert_min_quantity}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            setFormData((prev) => {
                              const pPrice = Number(prev.piece_price || 0);
                              return {
                                ...prev,
                                dessert_min_quantity: val,
                                dessert_default_price: pPrice > 0 ? Math.round(pPrice * val) : prev.dessert_default_price,
                              };
                            });
                          }}
                          placeholder="e.g. 1"
                          className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 font-mono"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Customer quantity starts at this number (e.g. 1 piece).
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Increment Step (Pieces) *
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required={isDessertSelected}
                          value={formData.dessert_step_size}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            setFormData((prev) => ({ ...prev, dessert_step_size: val }));
                          }}
                          placeholder="e.g. 2"
                          className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 font-mono"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Pieces added each + click (e.g. 2 → {formData.dessert_min_quantity || 1}, {Number(formData.dessert_min_quantity || 1) + (Number(formData.dessert_step_size) || 1)}, {Number(formData.dessert_min_quantity || 1) + 2 * (Number(formData.dessert_step_size) || 1)}…).
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                          Maximum Limit (Pieces) *
                        </label>
                        <input
                          type="number"
                          min={formData.dessert_min_quantity || 1}
                          step="1"
                          required={isDessertSelected}
                          value={formData.piece_limit}
                          onChange={(e) => {
                            const val = Math.max(1, parseInt(e.target.value) || 1);
                            setFormData((prev) => ({ ...prev, piece_limit: val }));
                          }}
                          placeholder="e.g. 10"
                          className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400 font-mono"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Maximum pieces customer can select. + button stops here.
                        </p>
                      </div>
                    </div>

                    {/* Derived Rate & Live Stepper Preview */}
                    <div className="bg-white/80 rounded-xl p-3 border border-rose-200 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">Configured Rate:</span>
                          <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-black font-mono">
                            ₹{Number(formData.piece_price || (Number(formData.dessert_default_price || formData.base_price || 0) / Number(formData.dessert_min_quantity || 1)) || 0).toFixed(2)} / piece
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                          Starting Base Total: <strong>{formData.dessert_min_quantity || 1} Pcs = ₹{Math.round(Number(formData.dessert_min_quantity || 1) * Number(formData.piece_price || (Number(formData.dessert_default_price || formData.base_price || 0) / Number(formData.dessert_min_quantity || 1)) || 0))}</strong>
                        </span>
                      </div>

                      {/* Preview Pill Chips */}
                      <div className="pt-2 border-t border-rose-100">
                        <span className="text-[11px] font-bold text-slate-600 block mb-1.5">
                          Customer Stepper Sequence (Starts at {formData.dessert_min_quantity || 1} pcs, step +{formData.dessert_step_size || 1}, max {formData.piece_limit || 20} pcs):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(() => {
                            const minQ = Number(formData.dessert_min_quantity || 1);
                            const stepQ = Math.max(1, Number(formData.dessert_step_size || 1));
                            const maxQ = Math.max(minQ, Number(formData.piece_limit || 20));
                            const unitP = Number(formData.piece_price || (Number(formData.dessert_default_price || formData.base_price || 0) / minQ) || 0);

                            const previewList = [];
                            for (let q = minQ; q <= maxQ && previewList.length < 8; q += stepQ) {
                              previewList.push(q);
                            }

                            return previewList.map((qty, idx) => {
                              const tierOverride = (formData.dessert_price_tiers || []).find(
                                (t) => Number(t.quantity) === qty
                              );
                              const price = tierOverride ? Number(tierOverride.price) : Math.round(unitP * qty);
                              const isLast = idx === previewList.length - 1;

                              return (
                                <span
                                  key={qty}
                                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-mono ${
                                    idx === 0
                                      ? 'bg-rose-600 text-white border-rose-600 font-black'
                                      : isLast
                                      ? 'bg-rose-50 text-rose-800 border-rose-300 font-bold'
                                      : 'bg-white text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {qty} Pcs = ₹{price}
                                  {idx === 0 && ' (Default)'}
                                  {isLast && idx !== 0 && ' (Max Reachable)'}
                                  {tierOverride && ' 🏷️'}
                                </span>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Custom Override Tiers */}
                    <div className="space-y-2 pt-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black text-chocolate">
                            Custom Price Tiers (Optional Overrides)
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Override linear pricing for specific piece quantities (e.g. 5 pcs = ₹220, 10 pcs = ₹400).
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddDessertTier}
                          className="text-xs font-bold text-rose-700 hover:text-rose-900 bg-rose-100 hover:bg-rose-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1 border border-rose-300"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Tier Override
                        </button>
                      </div>

                      {formData.dessert_price_tiers && formData.dessert_price_tiers.length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-rose-200 bg-white">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-rose-50/70 border-b border-rose-200 text-[10px] font-bold text-slate-600 uppercase">
                              <tr>
                                <th className="p-2">Quantity (Pieces)</th>
                                <th className="p-2">Custom Price (₹)</th>
                                <th className="p-2">Effective Rate</th>
                                <th className="p-2 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-rose-100 font-mono">
                              {formData.dessert_price_tiers.map((tier, idx) => (
                                <tr key={idx} className="hover:bg-rose-50/30">
                                  <td className="p-2">
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        min={formData.dessert_min_quantity || 1}
                                        value={tier.quantity}
                                        onChange={(e) => handleUpdateDessertTier(idx, 'quantity', e.target.value)}
                                        className="w-20 px-2 py-1 rounded border border-slate-200 font-bold focus:outline-none focus:border-rose-400"
                                      />
                                      <span className="text-slate-500 font-sans text-xs">Pcs</span>
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <div className="flex items-center gap-1">
                                      <span className="text-slate-500 font-sans">₹</span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={tier.price}
                                        onChange={(e) => handleUpdateDessertTier(idx, 'price', e.target.value)}
                                        className="w-24 px-2 py-1 rounded border border-slate-200 font-bold focus:outline-none focus:border-rose-400"
                                      />
                                    </div>
                                  </td>
                                  <td className="p-2 text-slate-500 text-[11px]">
                                    {Number(tier.quantity) > 0 && Number(tier.price) > 0
                                      ? `₹${(Number(tier.price) / Number(tier.quantity)).toFixed(2)}/pc`
                                      : '—'}
                                  </td>
                                  <td className="p-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveDessertTier(idx)}
                                      className="text-rose-500 hover:text-rose-700 p-1 hover:bg-rose-50 rounded cursor-pointer transition-colors"
                                      title="Remove tier"
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-100 text-[11px] text-rose-800">
                          ✨ No step overrides added. Quantities will automatically scale linearly: <em>{formData.dessert_min_quantity || 2} Pcs = ₹{formData.dessert_default_price || formData.base_price || 100}</em>, <em>{(Number(formData.dessert_min_quantity || 2) + 1)} Pcs = ₹{Math.round(((Number(formData.dessert_default_price || formData.base_price || 100) / Number(formData.dessert_min_quantity || 2))) * (Number(formData.dessert_min_quantity || 2) + 1))}</em>, etc.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* DRY FRUIT PACKAGING RULE SECTION */}
                {isDryFruitSelected && (
                  <div className="sm:col-span-2 rounded-2xl border-2 border-emerald-400 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 p-4 sm:p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🥜</span>
                          <h4 className="text-sm font-black text-emerald-950">
                            Dry Fruit Discrete Pack Packaging &amp; Pricing
                          </h4>
                          <span className="text-[10px] font-extrabold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wide">
                            Category: Dry Fruits Only
                          </span>
                        </div>
                        <p className="text-xs text-emerald-800/80 mt-1">
                          Define discrete pack sizes (grams or kg only). Customers only see these exact packs. Quantity stepper (+ / −) multiplies the <strong>number of packs</strong>, not the weight.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddDryFruitPack}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 active:scale-95 rounded-xl border border-emerald-300 transition-all cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Pack Option
                      </button>
                    </div>

                    {/* Pack Options Table / List */}
                    <div className="space-y-3">
                      {(formData.dry_fruit_pack_options || []).length > 0 ? (
                        <div className="overflow-x-auto rounded-xl border border-emerald-200 bg-white shadow-2xs">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-emerald-100/70 text-emerald-950 font-bold uppercase tracking-wider text-[10px] border-b border-emerald-200">
                              <tr>
                                <th className="px-3 py-2.5">#</th>
                                <th className="px-3 py-2.5">Pack Weight</th>
                                <th className="px-3 py-2.5">Unit (g / kg)</th>
                                <th className="px-3 py-2.5">Pack Label</th>
                                <th className="px-3 py-2.5">Pack Price (₹)</th>
                                <th className="px-3 py-2.5 text-center">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-100">
                              {(formData.dry_fruit_pack_options || []).map((pack, idx) => (
                                <tr key={idx} className="hover:bg-emerald-50/40 transition-colors">
                                  <td className="px-3 py-2 font-bold text-emerald-800">
                                    Pack {idx + 1}
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      type="number"
                                      min="1"
                                      step="any"
                                      value={pack.weight}
                                      onChange={(e) => handleUpdateDryFruitPack(idx, 'weight', e.target.value)}
                                      className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                                      placeholder="e.g. 200"
                                    />
                                  </td>
                                  <td className="px-3 py-2">
                                    <select
                                      value={pack.unit || 'g'}
                                      onChange={(e) => handleUpdateDryFruitPack(idx, 'unit', e.target.value)}
                                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    >
                                      <option value="g">Grams (g)</option>
                                      <option value="kg">Kilograms (kg)</option>
                                    </select>
                                  </td>
                                  <td className="px-3 py-2">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-900 font-extrabold text-xs font-mono">
                                      {pack.weight || 0}{pack.unit || 'g'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <div className="relative w-28">
                                      <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 font-bold">₹</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={pack.price}
                                        onChange={(e) => handleUpdateDryFruitPack(idx, 'price', e.target.value)}
                                        className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                                        placeholder="Price"
                                      />
                                    </div>
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveDryFruitPack(idx)}
                                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                      title="Remove Pack"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-white border border-dashed border-emerald-300 text-center space-y-2">
                          <p className="text-xs text-emerald-800 font-medium">
                            No pack options defined yet. Add discrete packs (e.g. 200g, 500g, 1kg) for customers to choose from.
                          </p>
                          <button
                            type="button"
                            onClick={handleAddDryFruitPack}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add First Pack
                          </button>
                        </div>
                      )}

                      {/* Live Customer Preview */}
                      {(formData.dry_fruit_pack_options || []).length > 0 && (
                        <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200">
                          <div className="text-[11px] font-bold text-emerald-900 mb-1.5 flex items-center gap-1.5">
                            <span>👀 Customer View Preview:</span>
                            <span className="text-[10px] font-normal text-emerald-700">(Discrete pack chips shown to customer)</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {(formData.dry_fruit_pack_options || []).map((p, idx) => (
                              <div
                                key={idx}
                                className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 shadow-2xs flex items-center gap-2"
                              >
                                <span className="font-extrabold text-xs text-slate-800 font-mono">
                                  {p.weight || 0}{p.unit || 'g'}
                                </span>
                                <span className="text-xs font-black text-emerald-700 font-mono">
                                  ₹{p.price || 0}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* CHOCOLATES PACKAGING & PRICING SECTION */}
                {isChocolatesSelected && (
                  <div className="sm:col-span-2 rounded-2xl border-2 border-amber-800/70 bg-gradient-to-br from-amber-950/5 via-white to-amber-900/5 p-4 sm:p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🍫</span>
                          <h4 className="text-sm font-black text-amber-950">
                            Chocolates Packaging &amp; Pricing Configuration
                          </h4>
                          <span className="text-[10px] font-extrabold bg-amber-800 text-white px-2.5 py-0.5 rounded-full shadow-xs uppercase tracking-wide">
                            Category: Chocolates
                          </span>
                        </div>
                        <p className="text-xs text-amber-900/80 mt-1">
                          Configure whether this chocolate is sold by <strong>Weight Variants (100g, 250g, 500g, etc.)</strong>, by <strong>Piece Count (starts at 1, +1 increment)</strong>, or <strong>Both</strong>.
                        </p>
                      </div>
                    </div>

                    {/* SALE MODE SWITCHER TABS */}
                    <div className="flex items-center gap-2 p-1.5 bg-amber-100/70 rounded-xl border border-amber-300 max-w-md">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, chocolate_pricing_type: 'weight' })}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          (formData.chocolate_pricing_type || 'weight') === 'weight'
                            ? 'bg-amber-900 text-white shadow-xs'
                            : 'text-amber-900 hover:bg-white/60'
                        }`}
                      >
                        ⚖️ By Weight Packs
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, chocolate_pricing_type: 'piece' })}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          formData.chocolate_pricing_type === 'piece'
                            ? 'bg-amber-900 text-white shadow-xs'
                            : 'text-amber-900 hover:bg-white/60'
                        }`}
                      >
                        🍬 By Piece Count
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, chocolate_pricing_type: 'both' })}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          formData.chocolate_pricing_type === 'both'
                            ? 'bg-amber-900 text-white shadow-xs'
                            : 'text-amber-900 hover:bg-white/60'
                        }`}
                      >
                        🔄 Both (Weight &amp; Piece)
                      </button>
                    </div>

                    {/* PART 1: WEIGHT VARIANTS TABLE (Mirrors Dry Fruits UI) */}
                    {((formData.chocolate_pricing_type || 'weight') === 'weight' || formData.chocolate_pricing_type === 'both') && (
                      <div className="space-y-3 pt-2 border-t border-amber-200/60">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-700" />
                            <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
                              Weight Variants &amp; Pricing (100g, 250g, 500g, etc.)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleAddChocolatePack}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 active:scale-95 rounded-xl border border-amber-300 transition-all cursor-pointer shrink-0"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add Weight Variant
                          </button>
                        </div>

                        {(formData.chocolate_pack_options || []).length > 0 ? (
                          <div className="overflow-x-auto rounded-xl border border-amber-200 bg-white shadow-2xs">
                            <table className="w-full text-xs text-left">
                              <thead className="bg-amber-100/70 text-amber-950 font-bold uppercase tracking-wider text-[10px] border-b border-amber-200">
                                <tr>
                                  <th className="px-3 py-2.5">#</th>
                                  <th className="px-3 py-2.5">Pack Weight</th>
                                  <th className="px-3 py-2.5">Unit (g / kg)</th>
                                  <th className="px-3 py-2.5">Pack Label</th>
                                  <th className="px-3 py-2.5">Pack Price (₹)</th>
                                  <th className="px-3 py-2.5 text-center">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-amber-100">
                                {(formData.chocolate_pack_options || []).map((pack, idx) => (
                                  <tr key={idx} className="hover:bg-amber-50/40 transition-colors">
                                    <td className="px-3 py-2 font-bold text-amber-900">
                                      Variant {idx + 1}
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="number"
                                        min="1"
                                        step="any"
                                        value={pack.weight}
                                        onChange={(e) => handleUpdateChocolatePack(idx, 'weight', e.target.value)}
                                        className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
                                        placeholder="e.g. 100"
                                      />
                                    </td>
                                    <td className="px-3 py-2">
                                      <select
                                        value={pack.unit || 'g'}
                                        onChange={(e) => handleUpdateChocolatePack(idx, 'unit', e.target.value)}
                                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                      >
                                        <option value="g">Grams (g)</option>
                                        <option value="kg">Kilograms (kg)</option>
                                      </select>
                                    </td>
                                    <td className="px-3 py-2">
                                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-100 text-amber-950 font-extrabold text-xs font-mono">
                                        {pack.weight || 0}{pack.unit || 'g'}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2">
                                      <div className="relative w-28">
                                        <span className="absolute inset-y-0 left-0 pl-2 flex items-center text-slate-400 font-bold">₹</span>
                                        <input
                                          type="number"
                                          min="1"
                                          value={pack.price}
                                          onChange={(e) => handleUpdateChocolatePack(idx, 'price', e.target.value)}
                                          className="w-full pl-6 pr-2 py-1.5 rounded-lg border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono"
                                          placeholder="Price"
                                        />
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveChocolatePack(idx)}
                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                                        title="Remove Variant"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-white border border-dashed border-amber-300 text-center space-y-2">
                            <p className="text-xs text-amber-900 font-medium">
                              No weight variants defined yet. Add variants (e.g. 100g, 250g, 500g) for customers to choose from.
                            </p>
                            <button
                              type="button"
                              onClick={handleAddChocolatePack}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-900 hover:bg-amber-950 text-white text-xs font-bold rounded-lg cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add First Variant
                            </button>
                          </div>
                        )}

                        {/* Live Customer Preview */}
                        {(formData.chocolate_pack_options || []).length > 0 && (
                          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                            <div className="text-[11px] font-bold text-amber-900 mb-1.5 flex items-center gap-1.5">
                              <span>👀 Customer View Preview:</span>
                              <span className="text-[10px] font-normal text-amber-800">(Discrete weight variant cards shown to customer)</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {(formData.chocolate_pack_options || []).map((p, idx) => (
                                <div
                                  key={idx}
                                  className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 shadow-2xs flex items-center gap-2"
                                >
                                  <span className="font-extrabold text-xs text-slate-800 font-mono">
                                    {p.weight || 0}{p.unit || 'g'}
                                  </span>
                                  <span className="text-xs font-black text-amber-800 font-mono">
                                    ₹{p.price || 0}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* PART 2: PIECE COUNT CONFIGURATION CARD */}
                    {(formData.chocolate_pricing_type === 'piece' || formData.chocolate_pricing_type === 'both') && (
                      <div className="space-y-3 pt-2 border-t border-amber-200/60">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-700" />
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-950">
                            Piece Count Sale Option (Single pieces: bonbons, bars, truffles)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Customers will see a piece-count stepper starting at <strong>1 Pc</strong>. Clicking <strong>+</strong> increments by 1 piece. Total price = pieces × unit price.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-white border border-amber-200">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Default Price per Piece (₹) *
                            </label>
                            <div className="relative">
                              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">₹</span>
                              <input
                                type="number"
                                min="1"
                                value={formData.piece_price || ''}
                                onChange={(e) => setFormData({ ...formData, piece_price: e.target.value })}
                                className="w-full pl-7 pr-3 py-2 rounded-lg border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-amber-500 font-mono"
                                placeholder="e.g. 50"
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">Price charged for each 1 piece</p>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Maximum Pieces Allowed per Order
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={formData.piece_limit || 20}
                              onChange={(e) => setFormData({ ...formData, piece_limit: e.target.value })}
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-amber-500 font-mono"
                              placeholder="e.g. 50"
                            />
                            <p className="text-[10px] text-slate-400 mt-0.5">Default max: 20 pieces</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SNACK FLEXIBLE PRICING SECTION */}
                {!isThemeCakeSelected && !isDessertSelected && !isDryFruitSelected && !isChocolatesSelected && !isCakesOrSweetsSelected && (
                <div className="sm:col-span-2">
                  <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-4 sm:p-5 transition-all shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">🥐</span>
                          <h4 className="text-sm font-black text-chocolate">
                            Snack Flexible Pricing (Unit Type &amp; Egg / Eggless)
                          </h4>
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                            Snacks Mode
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Configure whether this snack is sold by <strong>Piece</strong>, by <strong>Weight (Grams/Kg)</strong>, or <strong>Both</strong> with independent Egg and Eggless pricing.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={!!formData.enable_snack_matrix}
                          onChange={(e) => setFormData({ ...formData, enable_snack_matrix: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>

                    {formData.enable_snack_matrix && (
                      <div className="mt-4 pt-4 border-t border-amber-200/80 space-y-4">
                        {/* 1. Unit Type Selection */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                            Select Available Unit Type(s) *
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {/* Only Piece */}
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  snack_variants: {
                                    ...prev.snack_variants,
                                    pricing_type: 'piece',
                                  },
                                }))
                              }
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                                formData.snack_variants?.pricing_type === 'piece'
                                  ? 'border-amber-600 bg-white ring-2 ring-amber-500/30 shadow-xs'
                                  : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-chocolate flex items-center gap-1.5">
                                  <span>🍰</span>
                                  <span>Only Piece</span>
                                </span>
                                {formData.snack_variants?.pricing_type === 'piece' && (
                                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                                    Active
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500">
                                Sold only per individual piece/slice
                              </span>
                            </button>

                            {/* Only Weight */}
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  snack_variants: {
                                    ...prev.snack_variants,
                                    pricing_type: 'weight',
                                  },
                                }))
                              }
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                                formData.snack_variants?.pricing_type === 'weight'
                                  ? 'border-amber-600 bg-white ring-2 ring-amber-500/30 shadow-xs'
                                  : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-chocolate flex items-center gap-1.5">
                                  <span>⚖️</span>
                                  <span>Only Weight</span>
                                </span>
                                {formData.snack_variants?.pricing_type === 'weight' && (
                                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                                    Active
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500">
                                Sold by weight (Grams / Kilograms)
                              </span>
                            </button>

                            {/* Both Piece and Weight */}
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  snack_variants: {
                                    ...prev.snack_variants,
                                    pricing_type: 'both',
                                  },
                                }))
                              }
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                                formData.snack_variants?.pricing_type === 'both'
                                  ? 'border-amber-600 bg-white ring-2 ring-amber-500/30 shadow-xs'
                                  : 'border-slate-200 bg-white/70 hover:bg-white hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-chocolate flex items-center gap-1.5">
                                  <span>🥐</span>
                                  <span>Both (Piece &amp; Weight)</span>
                                </span>
                                {formData.snack_variants?.pricing_type === 'both' && (
                                  <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                                    Active
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500">
                                Customer selects Piece or Weight first
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* CONDITIONAL PANEL 1: PIECE-BASED PRICING */}
                        {(formData.snack_variants?.pricing_type === 'piece' || formData.snack_variants?.pricing_type === 'both') && (
                          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-3">
                            <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
                              <span className="text-base">🍰</span>
                              <span className="text-xs font-bold text-chocolate uppercase tracking-wider">
                                Piece-Based Pricing (Per Piece Rate)
                              </span>
                              {formData.snack_variants?.pricing_type === 'both' && (
                                <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold ml-auto">
                                  Option 1
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span>100% Pure Eggless Price (₹) *</span>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    required={formData.snack_variants?.pricing_type === 'piece' || formData.snack_variants?.pricing_type === 'both'}
                                    value={formData.snack_variants?.piece?.eggless_price || ''}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        snack_variants: {
                                          ...prev.snack_variants,
                                          piece: {
                                            ...prev.snack_variants?.piece,
                                            eggless_price: e.target.value,
                                          },
                                        },
                                      }))
                                    }
                                    placeholder="e.g. 50"
                                    className="w-full pl-6 p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-amber-500 font-mono"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                                  <span>With Egg Price (₹) *</span>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    required={formData.snack_variants?.pricing_type === 'piece' || formData.snack_variants?.pricing_type === 'both'}
                                    value={formData.snack_variants?.piece?.egg_price || ''}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        snack_variants: {
                                          ...prev.snack_variants,
                                          piece: {
                                            ...prev.snack_variants?.piece,
                                            egg_price: e.target.value,
                                          },
                                        },
                                      }))
                                    }
                                    placeholder="e.g. 40"
                                    className="w-full pl-6 p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-amber-500 font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* CONDITIONAL PANEL 2: WEIGHT-BASED PRICING */}
                        {(formData.snack_variants?.pricing_type === 'weight' || formData.snack_variants?.pricing_type === 'both') && (
                          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs space-y-3">
                            <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
                              <span className="text-base">⚖️</span>
                              <span className="text-xs font-bold text-chocolate uppercase tracking-wider">
                                Weight-Based Pricing (Grams / Kilograms)
                              </span>
                              {formData.snack_variants?.pricing_type === 'both' && (
                                <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold ml-auto">
                                  Option 2
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {/* Measurement Unit Selector */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                  Unit of Measurement *
                                </label>
                                <select
                                  value={formData.snack_variants?.weight?.unit || 'grams'}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      snack_variants: {
                                        ...prev.snack_variants,
                                        weight: {
                                          ...prev.snack_variants?.weight,
                                          unit: e.target.value,
                                        },
                                      },
                                    }))
                                  }
                                  className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                                >
                                  <option value="grams">Grams (g)</option>
                                  <option value="kg">Kilograms (kg)</option>
                                </select>
                              </div>

                              {/* Weight Portion Value */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                  Portion / Pack Size *
                                </label>
                                <input
                                  type="text"
                                  required={formData.snack_variants?.pricing_type === 'weight' || formData.snack_variants?.pricing_type === 'both'}
                                  value={formData.snack_variants?.weight?.value || '250g'}
                                  onChange={(e) =>
                                    setFormData((prev) => ({
                                      ...prev,
                                      snack_variants: {
                                        ...prev.snack_variants,
                                        weight: {
                                          ...prev.snack_variants?.weight,
                                          value: e.target.value,
                                        },
                                      },
                                    }))
                                  }
                                  placeholder="e.g. 250g"
                                  className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-amber-500"
                                />
                                <div className="flex gap-1 mt-1">
                                  {(formData.snack_variants?.weight?.unit === 'kg' ? ['0.5kg', '1kg', '2kg'] : ['100g', '250g', '500g']).map((val) => (
                                    <button
                                      key={val}
                                      type="button"
                                      onClick={() =>
                                        setFormData((prev) => ({
                                          ...prev,
                                          snack_variants: {
                                            ...prev.snack_variants,
                                            weight: {
                                              ...prev.snack_variants?.weight,
                                              value: val,
                                            },
                                          },
                                        }))
                                      }
                                      className="text-[10px] bg-amber-100/70 hover:bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-medium cursor-pointer"
                                    >
                                      {val}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Weight Eggless Price */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span>100% Pure Eggless Price (₹) *</span>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    required={formData.snack_variants?.pricing_type === 'weight' || formData.snack_variants?.pricing_type === 'both'}
                                    value={formData.snack_variants?.weight?.eggless_price || ''}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        snack_variants: {
                                          ...prev.snack_variants,
                                          weight: {
                                            ...prev.snack_variants?.weight,
                                            eggless_price: e.target.value,
                                          },
                                        },
                                      }))
                                    }
                                    placeholder="e.g. 140"
                                    className="w-full pl-6 p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-amber-500 font-mono"
                                  />
                                </div>
                              </div>

                              {/* Weight With Egg Price */}
                              <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                                  <span>With Egg Price (₹) *</span>
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    required={formData.snack_variants?.pricing_type === 'weight' || formData.snack_variants?.pricing_type === 'both'}
                                    value={formData.snack_variants?.weight?.egg_price || ''}
                                    onChange={(e) =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        snack_variants: {
                                          ...prev.snack_variants,
                                          weight: {
                                            ...prev.snack_variants?.weight,
                                            egg_price: e.target.value,
                                          },
                                        },
                                      }))
                                    }
                                    placeholder="e.g. 120"
                                    className="w-full pl-6 p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-amber-500 font-mono"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                )}

                {/* CAKE SHAPE OPTIONS & PRICING (Round, Heart, Square) */}
                {isCakesAndPastriesSelected && (
                  <div className="sm:col-span-2 bg-gradient-to-br from-pink-50/60 via-amber-50/40 to-white p-4 sm:p-5 rounded-2xl border-2 border-pink-200/80 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-chocolate flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-pink-600" />
                          <span>Cake Shape Options & Egg / Eggless Pricing (Per Kg)</span>
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Configure each cake shape with separate <strong>Egg price</strong> and <strong>Eggless price</strong> (per kg). Add new shapes, update prices, or delete shapes. Changes update live for customers.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddShape}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer self-start sm:self-auto shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Shape</span>
                      </button>
                    </div>

                    {(!formData.shapes || formData.shapes.length === 0) ? (
                      <div className="p-6 text-center border-2 border-dashed border-pink-200 rounded-xl bg-white/70 space-y-2">
                        <p className="text-xs font-medium text-slate-500">No cake shapes configured yet for this product.</p>
                        <button
                          type="button"
                          onClick={handleAddShape}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-300 text-xs font-bold cursor-pointer transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Your First Shape</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {formData.shapes.map((shapeItem, idx) => {
                          const isShapeActive = Boolean(shapeItem.is_active);
                          const shapeType = (shapeItem.shape || '').toLowerCase();
                          const shapeIcon = shapeType === 'round' ? '⚪' : shapeType === 'heart' ? '💖' : shapeType === 'square' ? '⬛' : '🎂';
                          return (
                            <div
                              key={shapeItem.id || idx}
                              className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between gap-3 ${
                                isShapeActive
                                  ? 'bg-white border-pink-300 shadow-xs'
                                  : 'bg-slate-50/90 border-dashed border-slate-200 opacity-75'
                              }`}
                            >
                              <div className="space-y-3">
                                {/* Header: Icon + Name + Active + Delete Action */}
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100 gap-2">
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <span className="text-base">{shapeIcon}</span>
                                    <input
                                      type="text"
                                      value={shapeItem.name || ''}
                                      onChange={(e) => handleUpdateShape(idx, 'name', e.target.value)}
                                      placeholder="Shape Name (e.g. Heart Shape)"
                                      className="font-bold text-xs text-slate-800 border border-transparent hover:border-slate-200 focus:border-pink-500 rounded px-1.5 py-0.5 w-full focus:outline-none bg-transparent"
                                      title="Click to edit shape display name"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <label className="flex items-center gap-1 cursor-pointer text-[11px] font-semibold text-slate-700 select-none">
                                      <input
                                        type="checkbox"
                                        checked={isShapeActive}
                                        onChange={(e) => handleUpdateShape(idx, 'is_active', e.target.checked)}
                                        className="w-3.5 h-3.5 rounded text-pink-600 focus:ring-pink-500 border-slate-300 cursor-pointer"
                                      />
                                      <span className={isShapeActive ? 'text-pink-700 font-bold' : 'text-slate-400'}>
                                        {isShapeActive ? 'Active' : 'Off'}
                                      </span>
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveShape(idx)}
                                      className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition cursor-pointer"
                                      title="Delete shape"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Shape Type Selector */}
                                <div className="flex items-center gap-2">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Type:</label>
                                  <select
                                    value={shapeItem.shape || 'Heart'}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      handleUpdateShape(idx, 'shape', val);
                                      if (!shapeItem.name || shapeItem.name === 'Custom Shape' || shapeItem.name.includes('Shape')) {
                                        handleUpdateShape(idx, 'name', `${val} Shape`);
                                      }
                                    }}
                                    className="text-[11px] font-semibold py-1 px-2 rounded-md border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:border-pink-500 w-full"
                                  >
                                    <option value="Heart">💖 Heart Shape</option>
                                    <option value="Round">⚪ Round Shape</option>
                                    <option value="Square">⬛ Square Shape</option>
                                    <option value="Rectangle">▭ Rectangle Shape</option>
                                    <option value="Custom">🎂 Custom Shape</option>
                                  </select>
                                </div>

                                {/* Separate Prices: Egg Price & Eggless Price */}
                                <div className="grid grid-cols-2 gap-2">
                                  {/* Egg Price */}
                                  <div>
                                    <label className="block text-[10px] font-bold text-amber-900 mb-1 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                                      <span>Egg (₹/kg) {isShapeActive && '*'}</span>
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-2 text-xs text-amber-700 font-bold">₹</span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={shapeItem.egg_price ?? ''}
                                        onChange={(e) => handleUpdateShape(idx, 'egg_price', e.target.value)}
                                        placeholder="e.g. 650"
                                        className="w-full pl-5 p-1.5 text-xs font-bold rounded-lg border border-amber-200 bg-amber-50/40 text-amber-950 focus:outline-none focus:border-amber-500 font-mono"
                                      />
                                    </div>
                                    <span className="text-[9px] text-slate-400 mt-0.5 block">With Egg price</span>
                                  </div>

                                  {/* Eggless Price */}
                                  <div>
                                    <label className="block text-[10px] font-bold text-emerald-900 mb-1 flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                      <span>Eggless (₹/kg) {isShapeActive && '*'}</span>
                                    </label>
                                    <div className="relative">
                                      <span className="absolute left-2 top-2 text-xs text-emerald-700 font-bold">₹</span>
                                      <input
                                        type="number"
                                        min="0"
                                        value={shapeItem.eggless_price ?? ''}
                                        onChange={(e) => handleUpdateShape(idx, 'eggless_price', e.target.value)}
                                        placeholder="e.g. 700"
                                        className="w-full pl-5 p-1.5 text-xs font-bold rounded-lg border border-emerald-200 bg-emerald-50/40 text-emerald-950 focus:outline-none focus:border-emerald-500 font-mono"
                                      />
                                    </div>
                                    <span className="text-[9px] text-slate-400 mt-0.5 block">100% Pure Veg</span>
                                  </div>
                                </div>

                                {/* Summary Bar */}
                                <div className="text-[10px] bg-slate-50 p-1.5 rounded border border-slate-200 flex items-center justify-between font-mono">
                                  <span className="text-slate-600 font-semibold truncate max-w-[90px]">
                                    {shapeItem.name || shapeItem.shape}
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-amber-800 font-bold">Egg: ₹{shapeItem.egg_price || 0}</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-emerald-800 font-bold">Veg: ₹{shapeItem.eggless_price || 0}</span>
                                  </div>
                                </div>

                                {/* Image Preview & Upload */}
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                                    Shape Photo Preview
                                  </label>
                                  {shapeItem.image ? (
                                    <div className="relative group mb-1.5 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-video flex items-center justify-center">
                                      <img
                                        src={formatImageUrl(shapeItem.image)}
                                        alt={shapeItem.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateShape(idx, 'image', '')}
                                        className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        title="Remove image"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="mb-1.5 p-2 text-center border border-dashed border-slate-200 rounded-lg bg-slate-50 text-[10px] text-slate-400">
                                      No photo uploaded yet
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2">
                                    <label className="flex-1">
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        disabled={uploadingShapeIndex === idx}
                                        onChange={(e) => {
                                          if (e.target.files?.[0]) {
                                            handleShapeImageUpload(idx, e.target.files[0]);
                                          }
                                        }}
                                      />
                                      <span className="flex items-center justify-center gap-1.5 w-full py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold cursor-pointer transition border border-slate-300">
                                        <Upload className="w-3 h-3 text-slate-500" />
                                        <span>{uploadingShapeIndex === idx ? 'Uploading...' : 'Upload Photo'}</span>
                                      </span>
                                    </label>
                                  </div>
                                  <div className="mt-1">
                                    <input
                                      type="text"
                                      value={shapeItem.image || ''}
                                      onChange={(e) => handleUpdateShape(idx, 'image', e.target.value)}
                                      placeholder="Or paste image URL"
                                      className="w-full p-1 text-[10px] rounded border border-slate-200 bg-white text-slate-600 focus:outline-none focus:border-pink-500 font-mono"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* CAKES & PASTRIES AND SWEETS SALE OPTIONS SECTION */}
                {isCakesOrSweetsSelected && (
                  <div className="sm:col-span-2 bg-gradient-to-br from-amber-50/70 to-white p-4 sm:p-5 rounded-2xl border-2 border-amber-300 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-chocolate flex items-center gap-1.5">
                          <Scale className="w-4 h-4 text-amber-700" />
                          <span>Sale Options ({isSweetsSelected ? 'Sweets' : 'Cakes & Pastries'}) *</span>
                        </span>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Enable how customers can purchase this {isSweetsSelected ? 'sweet' : 'cake'}: by <strong>Weight (kg)</strong>, by <strong>Pieces</strong>, or <strong>Both</strong>.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* OPTION 1: SELL BY KG */}
                      <div className={`p-4 rounded-xl border-2 transition-all ${
                        formData.sell_by_kg ? 'bg-white border-amber-400 shadow-xs' : 'bg-slate-50/80 border-dashed border-slate-200 opacity-80'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(formData.sell_by_kg)}
                              onChange={(e) => setFormData({ ...formData, sell_by_kg: e.target.checked })}
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                            />
                            <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              <span>⚖️ Sell by kg</span>
                            </span>
                          </label>
                          {formData.sell_by_kg && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">Active</span>
                          )}
                        </div>

                        {formData.sell_by_kg && (
                          <div className="space-y-3 pt-2 border-t border-slate-100">
                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Increment Step *
                                </label>
                                <select
                                  value={formData.kg_step}
                                  onChange={(e) => setFormData({ ...formData, kg_step: e.target.value })}
                                  className="w-full p-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500"
                                >
                                  <option value="0.5">0.5 kg</option>
                                  <option value="1">1 kg</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Default (Starting) kg *
                                </label>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0.5"
                                  value={formData.kg_default}
                                  onChange={(e) => setFormData({ ...formData, kg_default: e.target.value })}
                                  placeholder="e.g. 0.5 or 2"
                                  className="w-full p-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-mono"
                                />
                                <p className="text-[10px] text-slate-400 mt-0.5">Must be multiple of step</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Maximum kg *
                                </label>
                                <input
                                  type="number"
                                  step="0.5"
                                  min="0.5"
                                  value={formData.kg_max}
                                  onChange={(e) => setFormData({ ...formData, kg_max: e.target.value })}
                                  placeholder="e.g. 10"
                                  className="w-full p-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-mono"
                                />
                                <p className="text-[10px] text-slate-400 mt-0.5">Max allowed weight</p>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Price per kg (₹) *
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={formData.kg_price}
                                    onChange={(e) => setFormData({ ...formData, kg_price: e.target.value })}
                                    placeholder="e.g. 499"
                                    className="w-full pl-6 p-2 text-xs font-bold rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-mono"
                                  />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">Unit price per 1 kg</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* OPTION 2: SELL BY PIECES */}
                      <div className={`p-4 rounded-xl border-2 transition-all ${
                        formData.sell_by_pieces ? 'bg-white border-amber-400 shadow-xs' : 'bg-slate-50/80 border-dashed border-slate-200 opacity-80'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(formData.sell_by_pieces)}
                              onChange={(e) => setFormData({ ...formData, sell_by_pieces: e.target.checked })}
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                            />
                            <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              <span>🍰 Sell by pieces</span>
                            </span>
                          </label>
                          {formData.sell_by_pieces && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">Active</span>
                          )}
                        </div>

                        {formData.sell_by_pieces && (
                          <div className="space-y-3 pt-2 border-t border-slate-100">
                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Default (Starting) pieces *
                                </label>
                                <input
                                  type="number"
                                  step="1"
                                  min="1"
                                  value={formData.piece_default}
                                  onChange={(e) => setFormData({ ...formData, piece_default: e.target.value })}
                                  placeholder="e.g. 1"
                                  className="w-full p-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-mono"
                                />
                                <p className="text-[10px] text-slate-400 mt-0.5">Must be multiple of step</p>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Increment Step *
                                </label>
                                <input
                                  type="number"
                                  step="1"
                                  min="1"
                                  value={formData.piece_step}
                                  onChange={(e) => setFormData({ ...formData, piece_step: e.target.value })}
                                  placeholder="e.g. 1"
                                  className="w-full p-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-mono"
                                />
                                <p className="text-[10px] text-slate-400 mt-0.5">+ step per click</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Maximum pieces *
                                </label>
                                <input
                                  type="number"
                                  step="1"
                                  min="1"
                                  value={formData.piece_max}
                                  onChange={(e) => setFormData({ ...formData, piece_max: e.target.value })}
                                  placeholder="e.g. 20"
                                  className="w-full p-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-mono"
                                />
                                <p className="text-[10px] text-slate-400 mt-0.5">Max allowed pieces</p>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Price per piece (₹) *
                                </label>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={formData.piece_price}
                                    onChange={(e) => setFormData({ ...formData, piece_price: e.target.value })}
                                    placeholder="e.g. 60"
                                    className="w-full pl-6 p-2 text-xs font-bold rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-mono"
                                  />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">Unit price per piece</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* NEW FEATURE: FIXED PRICE BY WEIGHT */}
                    <div className={`p-4 rounded-xl border-2 transition-all ${
                      formData.enable_fixed_weight_pricing ? 'bg-white border-amber-500 shadow-xs' : 'bg-slate-50/80 border-dashed border-slate-200'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={Boolean(formData.enable_fixed_weight_pricing)}
                              onChange={(e) => setFormData({ ...formData, enable_fixed_weight_pricing: e.target.checked })}
                              className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 cursor-pointer"
                            />
                            <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                              <span>🏷️ Enable Fixed Weight Pricing</span>
                            </span>
                          </label>
                          {formData.enable_fixed_weight_pricing ? (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                              Active
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                              Off (Standard Increments)
                            </span>
                          )}
                        </div>

                        {formData.enable_fixed_weight_pricing && (
                          <button
                            type="button"
                            onClick={handleAddFixedWeightOption}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-chocolate bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shadow-2xs"
                          >
                            <Plus className="w-3.5 h-3.5 text-amber-700" />
                            <span>Add Weight Option</span>
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                        When enabled, customers will <strong>only see and pick from these preset weight-price bundles</strong> (e.g. 1 kg → ₹500, 2 kg → ₹940). The regular flexible +/− quantity stepper will be disabled on the customer website.
                      </p>

                      {formData.enable_fixed_weight_pricing && (
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                          {(!formData.fixed_weight_options || formData.fixed_weight_options.length === 0) ? (
                            <div className="text-center py-5 bg-amber-50/50 rounded-xl border border-dashed border-amber-200 space-y-2">
                              <p className="text-xs text-amber-800 font-medium">No fixed weight options configured yet.</p>
                              <button
                                type="button"
                                onClick={handleAddFixedWeightOption}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-chocolate hover:bg-amber-900 rounded-lg transition-colors cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add First Weight-Price (e.g. 1 kg → ₹500)</span>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase px-1">
                                <div className="col-span-5">Weight Option (e.g. 1 kg, 2 kg)</div>
                                <div className="col-span-5">Bundle Price (₹)</div>
                                <div className="col-span-2 text-right">Action</div>
                              </div>

                              {formData.fixed_weight_options.map((opt, idx) => (
                                <div
                                  key={idx}
                                  className="grid grid-cols-12 gap-2 items-center p-2.5 bg-slate-50 rounded-xl border border-slate-200"
                                >
                                  <div className="col-span-5">
                                    <input
                                      type="text"
                                      value={opt.weight}
                                      onChange={(e) => handleUpdateFixedWeightOption(idx, 'weight', e.target.value)}
                                      placeholder="e.g. 1 kg"
                                      className="w-full p-2 text-xs font-bold rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500"
                                    />
                                  </div>

                                  <div className="col-span-5">
                                    <div className="relative">
                                      <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                                      <input
                                        type="number"
                                        min="1"
                                        value={opt.price}
                                        onChange={(e) => handleUpdateFixedWeightOption(idx, 'price', e.target.value)}
                                        placeholder="e.g. 500"
                                        className="w-full pl-6 p-2 text-xs font-bold rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-mono"
                                      />
                                    </div>
                                  </div>

                                  <div className="col-span-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFixedWeightOption(idx)}
                                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                      title="Remove this weight option"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PORTION & WEIGHT CONFIGURATION SECTION */}
                {!formData.enable_snack_matrix && !isThemeCakeSelected && !isDessertSelected && !isDryFruitSelected && !isCakesOrSweetsSelected && !isChocolatesSelected && (
                <div className="sm:col-span-2 bg-gradient-to-br from-amber-50/70 to-white p-4 sm:p-5 rounded-2xl border-2 border-amber-200/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-chocolate flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-amber-700" />
                        <span>Portion & Weight Configuration *</span>
                      </span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Choose whether this product is sold by <strong>Weights (Grams to Kilograms)</strong>, by <strong>Portions (Pieces / Slices)</strong>, or <strong>Both (Pieces & Grams)</strong>.
                      </p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex flex-wrap items-center gap-1 bg-white p-1 rounded-xl border border-amber-300 shadow-2xs self-start">
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            portion_type: 'weight',
                            portion_unit: 'grams',
                            portion_step: '500g',
                            weight: '500g',
                            variants: [
                              { size_weight: '500g', price: prev.base_price || '549', discount_price: prev.discount_price || '' },
                              { size_weight: '1kg', price: prev.base_price ? String(Math.round(Number(prev.base_price) * 1.8)) : '999', discount_price: '' },
                              { size_weight: '1.5kg', price: prev.base_price ? String(Math.round(Number(prev.base_price) * 2.6)) : '1449', discount_price: '' },
                              { size_weight: '2kg', price: prev.base_price ? String(Math.round(Number(prev.base_price) * 3.4)) : '1899', discount_price: '' },
                            ],
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          formData.portion_type === 'weight' || (!formData.portion_type || (formData.portion_type !== 'portion' && formData.portion_type !== 'both'))
                            ? 'bg-chocolate text-white shadow-xs'
                            : 'text-slate-600 hover:text-chocolate hover:bg-slate-50'
                        }`}
                      >
                        <span>⚖️ By Weight (Grams to Kgs)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            portion_type: 'portion',
                            portion_unit: 'pieces',
                            portion_step: '1',
                            weight: '1 Piece',
                            variants: [
                              { size_weight: '1 Piece', price: prev.base_price || '120', discount_price: prev.discount_price || '' },
                              { size_weight: '2 Pieces', price: prev.base_price ? String(Math.round(Number(prev.base_price) * 1.9)) : '230', discount_price: '' },
                              { size_weight: '4 Pieces', price: prev.base_price ? String(Math.round(Number(prev.base_price) * 3.6)) : '440', discount_price: '' },
                            ],
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          formData.portion_type === 'portion'
                            ? 'bg-chocolate text-white shadow-xs'
                            : 'text-slate-600 hover:text-chocolate hover:bg-slate-50'
                        }`}
                      >
                        <span>🍰 By Portions (Pieces / Slices)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            portion_type: 'both',
                            portion_unit: 'grams',
                            portion_step: '500g',
                            weight: prev.weight && !prev.weight.includes('Piece') ? prev.weight : '500g',
                            piece_price: prev.piece_price || (prev.base_price ? String(Math.round(Number(prev.base_price) / 4)) : '120'),
                            piece_limit: prev.piece_limit || '20',
                            piece_min: '1',
                            is_unlimited_pieces: false,
                            variants: prev.variants && prev.variants.length > 0 && !prev.variants[0]?.size_weight?.includes('Piece')
                              ? prev.variants
                              : [
                                  { size_weight: '500g', price: prev.base_price || '549', discount_price: prev.discount_price || '' },
                                  { size_weight: '1kg', price: prev.base_price ? String(Math.round(Number(prev.base_price) * 1.8)) : '999', discount_price: '' },
                                  { size_weight: '1.5kg', price: prev.base_price ? String(Math.round(Number(prev.base_price) * 2.6)) : '1449', discount_price: '' },
                                  { size_weight: '2kg', price: prev.base_price ? String(Math.round(Number(prev.base_price) * 3.4)) : '1899', discount_price: '' },
                                ],
                          }));
                        }}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          formData.portion_type === 'both'
                            ? 'bg-chocolate text-white shadow-xs'
                            : 'text-slate-600 hover:text-chocolate hover:bg-slate-50'
                        }`}
                      >
                        <span>🎂 Both (Grams &amp; Pieces)</span>
                      </button>
                    </div>
                  </div>

                  {formData.portion_type === 'both' ? (
                    /* DUAL MODE CONFIGURATION: WEIGHT (GRAMS/KGS) AND PIECES (1 TO ADMIN LIMIT) */
                    <div className="space-y-4 pt-2">
                      <div className="bg-amber-100/60 p-3 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                        <span className="text-base">💡</span>
                        <div>
                          <strong>Dual Ordering Enabled:</strong> Customers on the website will be able to choose whether to order by <strong>Weight (Grams to Kgs)</strong> OR by <strong>Pieces (1 to {formData.is_unlimited_pieces ? 'Unlimited' : (formData.piece_limit || 20)} pieces)</strong>.
                        </div>
                      </div>

                      {/* SECTION 1: WEIGHT CONTROLS */}
                      <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/80 space-y-3">
                        <div className="flex items-center gap-2 border-b border-amber-200/50 pb-2">
                          <Scale className="w-3.5 h-3.5 text-amber-800" />
                          <span className="text-xs font-bold text-chocolate uppercase tracking-wider">
                            1. Weight Configuration (Grams to Kilograms)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 text-[11px] mb-1">
                              Default Min Weight *
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.weight}
                              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                              placeholder="e.g. 500g"
                              className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                            />
                            <div className="flex gap-1 mt-1">
                              {['500g', '0.5kg', '1kg'].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, weight: val })}
                                  className="text-[10px] bg-amber-100/70 hover:bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-medium cursor-pointer"
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 text-[11px] mb-1">
                              Weight Increment (+ Button)
                            </label>
                            <select
                              value={formData.portion_step || '500g'}
                              onChange={(e) => setFormData({ ...formData, portion_step: e.target.value })}
                              className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                            >
                              <option value="500g">+500g (0.5kg increments: 500g → 1kg → 1.5kg → 2kg)</option>
                              <option value="1kg">+1kg (1kg increments: 1kg → 2kg → 3kg)</option>
                              <option value="250g">+250g (Quarter kg increments: 250g → 500g → 750g)</option>
                            </select>
                          </div>
                        </div>

                        {/* Weight Tiers Table */}
                        <div className="pt-2 border-t border-amber-200/50 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-chocolate text-[11px]">
                              Weight Tiers &amp; Prices (Customers scale with + / - button):
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const count = (formData.variants?.length || 0) + 1;
                                const nextWeight = `${count * 0.5}kg`;
                                setFormData((prev) => ({
                                  ...prev,
                                  variants: [
                                    ...(prev.variants || []),
                                    { size_weight: nextWeight, price: '', discount_price: '' },
                                  ],
                                }));
                              }}
                              className="text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Add Weight Tier
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {formData.variants?.map((v, i) => (
                              <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                                <input
                                  type="text"
                                  value={v.size_weight}
                                  onChange={(e) => {
                                    const updated = [...formData.variants];
                                    updated[i].size_weight = e.target.value;
                                    setFormData({ ...formData, variants: updated });
                                  }}
                                  placeholder="500g"
                                  className="w-20 p-1 rounded-lg border border-slate-200 font-bold text-xs"
                                />
                                <span className="text-xs text-slate-400">₹</span>
                                <input
                                  type="number"
                                  value={v.price}
                                  onChange={(e) => {
                                    const updated = [...formData.variants];
                                    updated[i].price = e.target.value;
                                    setFormData({ ...formData, variants: updated });
                                  }}
                                  placeholder="Price"
                                  className="w-24 p-1 rounded-lg border border-slate-200 text-xs font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      variants: prev.variants.filter((_, idx) => idx !== i),
                                    }));
                                  }}
                                  className="text-rose-500 hover:text-rose-700 p-1 text-xs cursor-pointer"
                                  title="Remove tier"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* SECTION 2: PIECES CONTROLS (1 PIECE TO ADMIN LIMIT) */}
                      <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200/80 space-y-3">
                        <div className="flex items-center gap-2 border-b border-amber-200/50 pb-2">
                          <span className="text-sm">🍰</span>
                          <span className="text-xs font-bold text-chocolate uppercase tracking-wider">
                            2. Pieces Configuration (1 Piece to Admin Limit)
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-bold text-slate-700 text-[11px] mb-1">
                              Price Per Piece (₹) *
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-xs text-slate-400 font-bold">₹</span>
                              <input
                                type="number"
                                required
                                value={formData.piece_price}
                                onChange={(e) => setFormData({ ...formData, piece_price: e.target.value })}
                                placeholder="e.g. 120"
                                className="w-full pl-6 p-2 rounded-xl border border-slate-200 bg-white text-xs font-bold focus:outline-none focus:border-amber-500 font-mono"
                              />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">Price for each individual piece / slice</p>
                          </div>

                          <div>
                            <label className="block font-bold text-slate-700 text-[11px] mb-1">
                              Min Starting Pieces
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={formData.piece_min || '1'}
                              onChange={(e) => setFormData({ ...formData, piece_min: e.target.value })}
                              placeholder="1"
                              className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                            />
                            <p className="text-[10px] text-slate-400 mt-0.5">Customer starts order from 1 piece</p>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="block font-bold text-slate-700 text-[11px]">
                                Max Pieces Limit (Admin Limit)
                              </label>
                              <label className="flex items-center gap-1 text-[10px] font-bold text-amber-900 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={formData.is_unlimited_pieces}
                                  onChange={(e) => setFormData({ ...formData, is_unlimited_pieces: e.target.checked })}
                                  className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                />
                                <span>Unlimited</span>
                              </label>
                            </div>
                            <input
                              type="number"
                              min="1"
                              disabled={formData.is_unlimited_pieces}
                              value={formData.is_unlimited_pieces ? '' : formData.piece_limit}
                              onChange={(e) => setFormData({ ...formData, piece_limit: e.target.value })}
                              placeholder={formData.is_unlimited_pieces ? 'Unlimited Pieces' : 'e.g. 20'}
                              className={`w-full p-2 rounded-xl border text-xs font-semibold focus:outline-none ${
                                formData.is_unlimited_pieces
                                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                  : 'bg-white border-slate-200 focus:border-amber-500'
                              }`}
                            />
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {formData.is_unlimited_pieces
                                ? 'Customers can order unlimited pieces with + button'
                                : `Limits customer + button scaling to max ${formData.piece_limit || 20} pieces`}
                            </p>
                          </div>
                        </div>

                        {/* Quick summary badge */}
                        <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200/70 text-[11px] text-chocolate font-medium flex items-center justify-between">
                          <span>
                            Customer limits: <strong>1 Piece</strong> up to <strong>{formData.is_unlimited_pieces ? 'Unlimited' : `${formData.piece_limit || 20} Pieces`}</strong>
                          </span>
                          <span className="font-bold text-amber-800">
                            Rate: ₹{formData.piece_price || 0} / piece
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : formData.portion_type === 'portion' ? (
                    /* Portions Configuration */
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 text-[11px] mb-1">
                            Default Starting Portion (Min) *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            placeholder="e.g. 1 Piece"
                            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                          />
                          <div className="flex gap-1 mt-1">
                            {['1 Piece', '1 Slice', '1 Portion', 'Pack of 2'].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setFormData({ ...formData, weight: val })}
                                className="text-[10px] bg-amber-100/70 hover:bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-medium"
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 text-[11px] mb-1">
                            Portion Unit Label
                          </label>
                          <select
                            value={formData.portion_unit || 'pieces'}
                            onChange={(e) => setFormData({ ...formData, portion_unit: e.target.value })}
                            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                          >
                            <option value="pieces">Pieces (e.g. 1 Piece, 2 Pieces)</option>
                            <option value="slices">Slices (e.g. 1 Slice, 2 Slices)</option>
                            <option value="portions">Portions (e.g. 1 Portion, 2 Portions)</option>
                            <option value="packs">Packs / Boxes (e.g. Pack of 4)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 text-[11px] mb-1">
                            Portion Step (+ Button)
                          </label>
                          <select
                            value={formData.portion_step || '1'}
                            onChange={(e) => setFormData({ ...formData, portion_step: e.target.value })}
                            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                          >
                            <option value="1">+1 (1 → 2 → 3 → 4...)</option>
                            <option value="2">+2 (2 → 4 → 6 → 8...)</option>
                            <option value="4">+4 (4 → 8 → 12...)</option>
                          </select>
                        </div>
                      </div>

                      {/* Portion Tiers Table */}
                      <div className="pt-2 border-t border-amber-200/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-chocolate text-[11px]">
                            Portion Tiers & Prices (Customers scale with + / - button):
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const count = (formData.variants?.length || 0) + 1;
                              const label = `${count} ${formData.portion_unit === 'slices' ? 'Slices' : formData.portion_unit === 'portions' ? 'Portions' : formData.portion_unit === 'packs' ? 'Packs' : 'Pieces'}`;
                              setFormData((prev) => ({
                                ...prev,
                                variants: [
                                  ...(prev.variants || []),
                                  { size_weight: label, price: '', discount_price: '' },
                                ],
                              }));
                            }}
                            className="text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Portion Tier
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {formData.variants?.map((v, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                              <input
                                type="text"
                                value={v.size_weight}
                                onChange={(e) => {
                                  const updated = [...formData.variants];
                                  updated[i].size_weight = e.target.value;
                                  setFormData({ ...formData, variants: updated });
                                }}
                                placeholder="1 Piece"
                                className="w-24 p-1 rounded-lg border border-slate-200 font-bold text-xs"
                              />
                              <span className="text-xs text-slate-400">₹</span>
                              <input
                                type="number"
                                value={v.price}
                                onChange={(e) => {
                                  const updated = [...formData.variants];
                                  updated[i].price = e.target.value;
                                  setFormData({ ...formData, variants: updated });
                                }}
                                placeholder="Price"
                                className="w-24 p-1 rounded-lg border border-slate-200 text-xs font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    variants: prev.variants.filter((_, idx) => idx !== i),
                                  }));
                                }}
                                className="text-rose-500 hover:text-rose-700 p-1 text-xs cursor-pointer"
                                title="Remove tier"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Weight Configuration */
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 text-[11px] mb-1">
                            Default Starting Weight (Min) *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            placeholder="e.g. 500g"
                            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                          />
                          <div className="flex gap-1 mt-1">
                            {['500g', '0.5kg', '1kg'].map((val) => (
                              <button
                                key={val}
                                type="button"
                                onClick={() => setFormData({ ...formData, weight: val })}
                                className="text-[10px] bg-amber-100/70 hover:bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-medium"
                              >
                                {val}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 text-[11px] mb-1">
                            Stepping Increment (+ Button) *
                          </label>
                          <select
                            value={formData.portion_step || '500g'}
                            onChange={(e) => setFormData({ ...formData, portion_step: e.target.value })}
                            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                          >
                            <option value="500g">+500g (0.5kg increments: 500g → 1kg → 1.5kg → 2kg)</option>
                            <option value="1kg">+1kg (1kg increments: 1kg → 2kg → 3kg)</option>
                            <option value="250g">+250g (Quarter kg increments: 250g → 500g → 750g)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-slate-700 text-[11px] mb-1">
                            Measurement Unit
                          </label>
                          <select
                            value={formData.portion_unit || 'grams'}
                            onChange={(e) => setFormData({ ...formData, portion_unit: e.target.value })}
                            className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-amber-500"
                          >
                            <option value="grams">Grams &amp; Kilograms (g / kg)</option>
                            <option value="kg">Kilograms (kg)</option>
                            <option value="lbs">Pounds (lbs)</option>
                          </select>
                        </div>
                      </div>

                      {/* Weight Tiers Table */}
                      <div className="pt-2 border-t border-amber-200/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-chocolate text-[11px]">
                            Weight Tiers &amp; Prices (Customers scale with + / - button):
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const count = (formData.variants?.length || 0) + 1;
                              const nextWeight = `${count * 0.5}kg`;
                              setFormData((prev) => ({
                                ...prev,
                                variants: [
                                  ...(prev.variants || []),
                                  { size_weight: nextWeight, price: '', discount_price: '' },
                                ],
                              }));
                            }}
                            className="text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Add Weight Tier
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {formData.variants?.map((v, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                              <input
                                type="text"
                                value={v.size_weight}
                                onChange={(e) => {
                                  const updated = [...formData.variants];
                                  updated[i].size_weight = e.target.value;
                                  setFormData({ ...formData, variants: updated });
                                }}
                                placeholder="500g"
                                className="w-20 p-1 rounded-lg border border-slate-200 font-bold text-xs"
                              />
                              <span className="text-xs text-slate-400">₹</span>
                              <input
                                type="number"
                                value={v.price}
                                onChange={(e) => {
                                  const updated = [...formData.variants];
                                  updated[i].price = e.target.value;
                                  setFormData({ ...formData, variants: updated });
                                }}
                                placeholder="Price"
                                className="w-24 p-1 rounded-lg border border-slate-200 text-xs font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    variants: prev.variants.filter((_, idx) => idx !== i),
                                  }));
                                }}
                                className="text-rose-500 hover:text-rose-700 p-1 text-xs cursor-pointer"
                                title="Remove tier"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                )}

                {/* Cupcake Two-Level Variant Matrix (Cream Type × Egg Type) */}
                <div className="sm:col-span-2 pt-2">
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 sm:p-5 transition-all">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🧁</span>
                          <h4 className="text-sm font-bold text-chocolate">Cupcake Variant Matrix (Cream Type × Egg Type)</h4>
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                            Two-Level Pricing
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Configure independent pricing for combinations of Cream types (With Cream / Without Cream) and Egg types (Egg / Eggless).
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={!!formData.enable_cupcake_matrix}
                          onChange={(e) => setFormData({ ...formData, enable_cupcake_matrix: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>

                    {formData.enable_cupcake_matrix && (
                      <div className="mt-4 pt-4 border-t border-amber-200/70 space-y-5">
                        {/* 1. Manage Cream Options */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            1. Cream Options (e.g. With Cream, Without Cream)
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2.5">
                            {(formData.cupcake_variants?.cream_options || []).map((cream) => (
                              <span
                                key={cream.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-amber-300 text-xs font-semibold text-slate-800 shadow-2xs"
                              >
                                {cream.name}
                                {(formData.cupcake_variants?.cream_options || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveCreamOption(cream.id)}
                                    className="text-rose-500 hover:text-rose-700 font-bold ml-1 cursor-pointer text-xs"
                                    title="Delete cream option"
                                  >
                                    ✕
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2 max-w-sm">
                            <input
                              type="text"
                              value={newCreamInput}
                              onChange={(e) => setNewCreamInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCreamOption(); } }}
                              placeholder="New cream option (e.g. Extra Cream)"
                              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAddCreamOption}
                              className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 cursor-pointer transition shadow-2xs"
                            >
                              + Add Cream
                            </button>
                          </div>
                        </div>

                        {/* 2. Manage Egg Options */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                            2. Egg / Recipe Options (e.g. With Egg, 100% Pure Eggless)
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2.5">
                            {(formData.cupcake_variants?.egg_options || []).map((egg) => (
                              <span
                                key={egg.id}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-xs font-semibold text-slate-800 shadow-2xs"
                              >
                                <span className={`w-2 h-2 rounded-full ${egg.id.includes('eggless') ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {egg.name}
                                {(formData.cupcake_variants?.egg_options || []).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveEggOption(egg.id)}
                                    className="text-rose-500 hover:text-rose-700 font-bold ml-1 cursor-pointer text-xs"
                                    title="Delete egg option"
                                  >
                                    ✕
                                  </button>
                                )}
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-2 max-w-sm">
                            <input
                              type="text"
                              value={newEggInput}
                              onChange={(e) => setNewEggInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEggOption(); } }}
                              placeholder="New egg/dietary option"
                              className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleAddEggOption}
                              className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer transition shadow-2xs"
                            >
                              + Add Egg Option
                            </button>
                          </div>
                        </div>

                        {/* 3. Combinations Matrix Pricing Table */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                            3. Combination Prices (Matrix)
                          </label>
                          <div className="bg-white rounded-xl border border-amber-200 overflow-hidden shadow-2xs">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-amber-100/60 text-slate-700 font-bold border-b border-amber-200 uppercase tracking-wider">
                                  <tr>
                                    <th className="px-3.5 py-2.5">Cream Type</th>
                                    <th className="px-3.5 py-2.5">Egg / Recipe</th>
                                    <th className="px-3.5 py-2.5">Price (₹)</th>
                                    <th className="px-3.5 py-2.5 text-center">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100">
                                  {(formData.cupcake_variants?.matrix || []).map((m, idx) => {
                                    const creamName = (formData.cupcake_variants?.cream_options || []).find((c) => c.id === m.cream_id)?.name || m.cream_id;
                                    const eggName = (formData.cupcake_variants?.egg_options || []).find((e) => e.id === m.egg_id)?.name || m.egg_id;
                                    return (
                                      <tr key={`${m.cream_id}_${m.egg_id}_${idx}`} className="hover:bg-amber-50/40 transition-colors">
                                        <td className="px-3.5 py-2.5 font-semibold text-slate-800">
                                          {creamName}
                                        </td>
                                        <td className="px-3.5 py-2.5 text-slate-700">
                                          <span className="inline-flex items-center gap-1.5">
                                            <span className={`w-2 h-2 rounded-full ${m.egg_id.includes('eggless') ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            {eggName}
                                          </span>
                                        </td>
                                        <td className="px-3.5 py-2.5">
                                          <div className="flex items-center gap-1">
                                            <span className="text-slate-400 font-semibold">₹</span>
                                            <input
                                              type="number"
                                              value={m.price}
                                              onChange={(e) => handleUpdateMatrixPrice(m.cream_id, m.egg_id, e.target.value)}
                                              placeholder="Price"
                                              className="w-24 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                                              min="0"
                                              step="1"
                                            />
                                          </div>
                                        </td>
                                        <td className="px-3.5 py-2.5 text-center">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleMatrixAvailability(m.cream_id, m.egg_id)}
                                            className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition ${
                                              m.is_available !== false
                                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                            }`}
                                          >
                                            {m.is_available !== false ? 'Available' : 'Unavailable'}
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Dietary Selection: 100% Eggless vs With Egg */}
                <div className="space-y-1.5 sm:col-span-2 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Dietary Classification *
                  </label>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Select recipe type: <strong>100% Eggless</strong> will appear in the Eggless & All sections; <strong>With Egg</strong> will appear in the With Egg & All sections.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_eggless: true })}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        formData.is_eggless
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 font-bold shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-emerald-600 border-2 border-white ring-1 ring-emerald-600 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-chocolate flex items-center gap-1">
                          <span>🌱 100% Pure Eggless</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Veg</span>
                        </div>
                        <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                          Visible in <strong>100% Eggless</strong> section
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_eggless: false })}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                        !formData.is_eggless
                          ? 'border-amber-700 bg-amber-50 text-amber-950 ring-2 ring-amber-700/20 font-bold shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="w-4 h-4 rounded-full bg-amber-700 border-2 border-white ring-1 ring-amber-700 shrink-0" />
                      <div>
                        <div className="text-xs font-bold text-chocolate flex items-center gap-1">
                          <span>🥚 With Egg (Classic Cake)</span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">Non-Veg</span>
                        </div>
                        <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                          Visible in <strong>With Egg</strong> section
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* DUAL-MODE IMAGE UPLOADER: LOCAL GALLERY OR URL LINK */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-chocolate flex items-center gap-1.5 text-xs">
                    <ImageIcon className="w-4 h-4 text-amber-600" />
                    <span>Cake Product Image</span>
                  </span>

                  {/* Mode Switcher */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setImageMode('gallery')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                        imageMode === 'gallery'
                          ? 'bg-chocolate text-white shadow-2xs'
                          : 'text-slate-500 hover:text-chocolate'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>From Local Gallery / Device</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMode('url')}
                      className={`px-3 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-all ${
                        imageMode === 'url'
                          ? 'bg-chocolate text-white shadow-2xs'
                          : 'text-slate-500 hover:text-chocolate'
                      }`}
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>From Image Link / URL</span>
                    </button>
                  </div>
                </div>

                {/* Option 1: Local Device Gallery Upload */}
                {imageMode === 'gallery' && (
                  <div className="space-y-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleLocalImageSelect}
                      className="hidden"
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-amber-300 hover:border-amber-500 bg-white hover:bg-amber-50/40 rounded-2xl p-4 text-center cursor-pointer transition-all"
                    >
                      {uploadingImage ? (
                        <div className="flex flex-col items-center justify-center gap-2 py-2">
                          <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                          <span className="font-bold text-amber-800">Uploading photo from local gallery...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-1">
                            <Upload className="w-4 h-4" />
                          </div>
                          <p className="font-bold text-chocolate text-xs">
                            Click to browse photo from your device / local gallery
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Recommended resolution: <strong>800 × 800 px</strong> or <strong>1000 × 1000 px</strong> (Square 1:1, Max 15MB, JPG/PNG/WebP)
                          </p>
                        </div>
                      )}
                    </div>

                    {uploadSuccessName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Uploaded: {uploadSuccessName}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Option 2: Image URL Input */}
                {imageMode === 'url' && (
                  <div className="space-y-2">
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="Paste image web link (e.g. https://images.unsplash.com/...)"
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-amber-500 font-mono text-[11px]"
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Quick presets:</span>
                      {[
                        { label: 'Chocolate', url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700' },
                        { label: 'Fruit Cake', url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=700' },
                        { label: 'Red Velvet', url: 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=700' },
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setFormData({ ...formData, image_url: preset.url })}
                          className="text-[10px] bg-slate-200 hover:bg-amber-100 text-slate-700 hover:text-amber-800 px-2 py-0.5 rounded-md font-medium"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Image Live Preview */}
                {formData.image_url && (
                  <div className="flex items-center gap-3 pt-2">
                    <img
                      src={formatImageUrl(formData.image_url)}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-amber-300 shadow-2xs"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300';
                      }}
                    />
                    <div className="flex-1 min-w-0 text-[11px] text-slate-500 truncate">
                      <div className="font-bold text-chocolate">Active Image Preview</div>
                      <div className="truncate font-mono text-[10px]">{formData.image_url}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, image_url: '' });
                        setUploadSuccessName('');
                      }}
                      className="text-rose-500 hover:text-rose-700 p-1 text-[11px] font-bold"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Descriptions */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Short Description (Tagline)</label>
                <input
                  type="text"
                  value={formData.short_description}
                  onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
                  placeholder="e.g. Rich Belgian ganache layered with moist cocoa sponge."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Description / Ingredients</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Elaborate taste profile, ingredients, and allergen info..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Badges / Visibility Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-700">Available</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_popular}
                    onChange={(e) => setFormData({ ...formData, is_popular: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-700">Bestseller</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_new_arrival}
                    onChange={(e) => setFormData({ ...formData, is_new_arrival: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-700">New Arrival</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_gifting}
                    onChange={(e) => setFormData({ ...formData, is_gifting: e.target.checked })}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-700">Gifting Set</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 text-white rounded-xl font-bold shadow-xs"
                >
                  {editingId ? 'Update Cake' : 'Create Cake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import & Update Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto p-6 sm:p-8 shadow-2xl space-y-6 border border-amber-100">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-xl text-chocolate">
                    Bulk Product CSV Import & Excel Update
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Add new products or update existing details across the entire store via spreadsheet.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Explanatory Info Card */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs space-y-2 text-amber-950">
              <div className="font-bold flex items-center gap-1.5 text-amber-900">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>How Bulk Updating & Adding Works:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px] leading-relaxed pl-1">
                <li>
                  <strong>Updating Existing Products:</strong> Keep the <code>ID</code>, <code>SKU</code>, or <code>Slug</code> in the CSV. Any column you change (e.g. price, stock, eggless, description, variants) will automatically update the live product.
                </li>
                <li>
                  <strong>Adding New Products:</strong> Leave the <code>ID</code> column blank. A new cake/product will be created with an auto-generated SKU if left empty.
                </li>
                <li>
                  <strong>Theme Cakes:</strong> Set Category to <code>Theme Cakes</code> and leave Subcategory empty.
                </li>
                <li>
                  <strong>Variants Format:</strong> Multiple sizes are defined as <code>Size:Price:Discount</code> separated by <code>|</code> (e.g. <code>500g:499:450|1kg:899:849</code>).
                </li>
              </ul>
            </div>

            {/* Template & Export Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
              <div className="text-xs text-slate-600">
                Need a ready-made template or your current inventory?
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-100/70 hover:bg-amber-200/80 px-3 py-1.5 rounded-xl transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample Template</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  disabled={exportingCsv}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/80 px-3 py-1.5 rounded-xl transition-all"
                >
                  {exportingCsv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>Export Live Products</span>
                </button>
              </div>
            </div>

            {/* File Upload Zone */}
            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div
                onClick={() => bulkFileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  importFile
                    ? 'border-emerald-400 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-amber-400 bg-slate-50/50 hover:bg-amber-50/20'
                }`}
              >
                <input
                  ref={bulkFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${importFile ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {importFile ? <CheckCircle2 className="w-6 h-6" /> : <FileUp className="w-6 h-6" />}
                  </div>
                  {importFile ? (
                    <div>
                      <p className="font-bold text-xs text-emerald-900">{importFile.name}</p>
                      <p className="text-[10px] text-slate-500">{(importFile.size / 1024).toFixed(1)} KB — Click to change file</p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-xs text-slate-700">Click or drag & drop your completed .csv file here</p>
                      <p className="text-[10px] text-slate-400">Compatible with Microsoft Excel, Google Sheets & Apple Numbers</p>
                    </div>
                  )}
                </div>
              </div>

              {/* CSV Quick Preview */}
              {csvPreviewRows.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                    <span>File Preview (First {csvPreviewRows.length - 1} data rows):</span>
                    <span className="text-slate-400 font-normal">{csvPreviewRows[0]?.length || 0} columns detected</span>
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-40 bg-white">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                        <tr>
                          {csvPreviewRows[0]?.slice(0, 8).map((col, idx) => (
                            <th key={idx} className="p-2 whitespace-nowrap">{col}</th>
                          ))}
                          {csvPreviewRows[0]?.length > 8 && (
                            <th className="p-2 text-slate-400">+{csvPreviewRows[0].length - 8} more cols</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {csvPreviewRows.slice(1).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-50">
                            {row.slice(0, 8).map((val, cIdx) => (
                              <td key={cIdx} className="p-2 whitespace-nowrap text-slate-700 max-w-[120px] truncate">
                                {val || <span className="text-slate-300 italic">—</span>}
                              </td>
                            ))}
                            {row.length > 8 && (
                              <td className="p-2 text-slate-400 text-center">...</td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Import Results Banner */}
              {importResult && (
                <div className="p-4 rounded-2xl border bg-slate-50 border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-chocolate">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Import Results:</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl p-2 font-bold">
                      <div className="text-lg">{importResult.created_count}</div>
                      <div className="text-[10px] uppercase font-semibold">New Created</div>
                    </div>
                    <div className="bg-blue-50 text-blue-800 border border-blue-200 rounded-xl p-2 font-bold">
                      <div className="text-lg">{importResult.updated_count}</div>
                      <div className="text-[10px] uppercase font-semibold">Updated</div>
                    </div>
                    <div className={`rounded-xl p-2 font-bold border ${importResult.failed_count > 0 ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      <div className="text-lg">{importResult.failed_count}</div>
                      <div className="text-[10px] uppercase font-semibold">Failed / Skipped</div>
                    </div>
                  </div>

                  {importResult.errors && importResult.errors.length > 0 && (
                    <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-900 space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Notices / Errors ({importResult.errors.length}):</span>
                      </div>
                      <ul className="list-disc list-inside max-h-32 overflow-y-auto space-y-0.5">
                        {importResult.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!importFile || importing}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing & Updating Products...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload & Update Website</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;
