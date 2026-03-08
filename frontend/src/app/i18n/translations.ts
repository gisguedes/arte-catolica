export type Locale = 'es' | 'en';

export const translations: Record<Locale, Record<string, string>> = {
  es: {
    // Navbar
    'nav.about': 'Sobre nosotros',
    'nav.cart': 'Carrito',
    'nav.categories': 'Categorías',
    'nav.techniques': 'Técnicas',
    'nav.explore': 'Explorar',
    'nav.products': 'Productos',
    'nav.artists': 'Artistas',
    'nav.myArea': 'Mi Área',
    'nav.logout': 'Cerrar Sesión',
    'nav.login': 'Iniciar Sesión',
    'nav.openMenu': 'Abrir menú',
    'nav.brand': 'Arte Católica',

    // Footer
    'footer.tagline': 'Tu tienda de arte religioso y objetos de devoción de calidad.',
    'footer.history':
      'Descubre nuestra historia y el propósito que nos guía en cada pieza que compartimos.',
    'footer.learnMore': 'Conoce quiénes somos →',
    'footer.links': 'Enlaces',
    'footer.home': 'Inicio',
    'footer.info': 'Información',
    'footer.contact': 'Contacto',
    'footer.seller': 'Ser Vendedor',
    'footer.faq': 'Preguntas Frecuentes',
    'footer.follow': 'Síguenos',
    'footer.rights': 'Todos los derechos reservados',

    // Common
    'common.loading': 'Cargando...',
    'common.close': 'Cerrar',
    'common.back': 'Volver',

    // Products
    'products.title': 'Productos',
    'products.featured': 'Productos Destacados',
    'products.subtitle':
      'Descubre piezas únicas con historia y significado. Arte religioso seleccionado con criterios de calidad y autenticidad.',
    'products.loading': 'Cargando productos...',
    'products.noResults': 'No se encontraron productos con estos filtros.',
    'products.addToCart': 'Agregar al Carrito',
    'products.viewAll': 'Ver todos los productos',
    'products.backToProducts': 'Volver a productos',

    // Filters & Sort
    'filters.title': 'Filtros',
    'filters.sort': 'Ordenación',
    'filters.sortRelevance': 'Más relevante',
    'filters.sortPriceLow': 'Precio más bajo',
    'filters.sortPriceHigh': 'Precio más alto',
    'filters.apply': 'Aplicar filtros',
    'filters.clear': 'Ver todos los productos',

    // Categories
    'categories.title': 'Categorías',
    'categories.subtitle':
      'Explora nuestras categorías de arte religioso y descubre colecciones pensadas para cada devoción.',
    'categories.loading': 'Cargando categorías...',

    // Techniques
    'techniques.title': 'Técnicas',
    'techniques.subtitle':
      'Explora nuestras técnicas artísticas y descubre obras creadas con diferentes métodos.',
    'techniques.loading': 'Cargando técnicas...',
    'techniques.noTechniques': 'No hay técnicas disponibles.',
    'techniques.noProducts': 'No hay productos con esta técnica.',
    'techniques.backToProducts': 'Volver a productos',

    // Artists
    'artists.title': 'Artistas',
    'artists.subtitle': 'Conoce a nuestros artistas y sus colecciones.',
    'artists.loading': 'Cargando artistas...',
    'artists.noResults': 'No hay artistas para el tipo seleccionado.',
    'artists.all': 'Todos',

    // Cart
    'cart.title': 'Carrito de Compras',
    'cart.empty': 'Tu carrito está vacío',
    'cart.quantity': 'Cantidad:',
    'cart.summary': 'Resumen del Pedido',
    'cart.subtotal': 'Subtotal',
    'cart.item': 'artículo',
    'cart.items': 'artículos',
    'cart.shipping': 'Envío',
    'cart.total': 'Total',
    'cart.clear': 'Vaciar Carrito',

    // Product detail
    'productDetail.back': '← Volver a productos',
    'productDetail.backToCatalog': 'Volver al catálogo',
    'productDetail.fullscreen': 'Ver imagen a pantalla completa',
    'productDetail.category': 'Categoría:',
    'productDetail.noDescription': 'Descripción disponible próximamente.',
    'productDetail.shippingEstimate': 'Previsión de entrega',
    'productDetail.shippingFrom': 'Envío desde',
    'productDetail.measures': 'Medidas: ancho por alto por profundidad en centímetros',
    'productDetail.techniques': 'Técnicas',
    'productDetail.materialDetail': 'Detalle del material:',
    'productDetail.shippingCalendar': 'Calendario de envíos',

    // Category detail
    'categoryDetail.noProducts': 'No hay productos para la categoría seleccionada.',
    'categoryDetail.backToCategories': 'Volver a categorías',
    'categoryDetail.paginationLast': 'Último »',

    // Login
    'login.welcome': 'Bienvenido a Arte Católica',
    'login.subtitle': 'Inicia sesión o crea tu cuenta',
    'login.google': 'Continuar con Google',
    'login.apple': 'Continuar con Apple',
    'login.email': 'Email',
    'login.password': 'Contraseña',
    'login.passwordMin': 'La contraseña debe tener al menos 6 caracteres',
    'login.invalidEmail': 'Email inválido',
    'login.name': 'Nombre',
    'login.surname': 'Apellidos',
    'login.minChars': 'Mínimo 6 caracteres',
    'login.signIn': 'Iniciar Sesión',
    'login.createAccount': 'Crear cuenta',
    'login.signInLink': 'Iniciar sesión',

    // Profile
    'profile.title': 'Mi Área Personal',
    'profile.choose': 'Elige tu tipo de perfil',
    'profile.buyer': 'Comprador',
    'profile.seller': 'Vendedor',
    'profile.buyerDesc': 'Gestiona tus pedidos, favoritos y direcciones de entrega',
    'profile.sellerDesc': 'Gestiona tus productos, pedidos y datos profesionales',
    'profile.personalData': 'Mis datos personales',

    // Pagination
    'pagination.first': '« Primero',
    'pagination.prev': '‹',
    'pagination.next': '›',
    'pagination.last': 'Último »',

    // Home
    'home.welcome': 'Bienvenido a Arte Católica',
    'home.subtitle': 'Descubre la belleza del arte sagrado y la tradición católica',
    'home.explore': 'Explora nuestra colección de arte religioso y sagrado',
    'home.education': 'Educación',
    'home.educationDesc': 'Aprende sobre la simbología y el significado del arte religioso',

    // Availability
    'availability.inStock': 'En stock',
    'availability.limited': 'Stock limitado',
    'availability.onDemand': 'Bajo demanda',

    // Misc
    'news.readMore': 'Leer más →',
    'productCard.shippingFrom': 'Entrega desde',
  },
  en: {
    // Navbar
    'nav.about': 'About us',
    'nav.cart': 'Cart',
    'nav.categories': 'Categories',
    'nav.techniques': 'Techniques',
    'nav.explore': 'Explore',
    'nav.products': 'Products',
    'nav.artists': 'Artists',
    'nav.myArea': 'My Area',
    'nav.logout': 'Log out',
    'nav.login': 'Log in',
    'nav.openMenu': 'Open menu',
    'nav.brand': 'Arte Católica',

    // Footer
    'footer.tagline': 'Your store for religious art and quality devotional objects.',
    'footer.history':
      'Discover our history and the purpose that guides us in every piece we share.',
    'footer.learnMore': 'Learn about us →',
    'footer.links': 'Links',
    'footer.home': 'Home',
    'footer.info': 'Information',
    'footer.contact': 'Contact',
    'footer.seller': 'Become a Seller',
    'footer.faq': 'FAQ',
    'footer.follow': 'Follow us',
    'footer.rights': 'All rights reserved',

    // Common
    'common.loading': 'Loading...',
    'common.close': 'Close',
    'common.back': 'Back',

    // Products
    'products.title': 'Products',
    'products.featured': 'Featured Products',
    'products.subtitle':
      'Discover unique pieces with history and meaning. Religious art selected for quality and authenticity.',
    'products.loading': 'Loading products...',
    'products.noResults': 'No products found with these filters.',
    'products.addToCart': 'Add to Cart',
    'products.viewAll': 'View all products',
    'products.backToProducts': 'Back to products',

    // Filters & Sort
    'filters.title': 'Filters',
    'filters.sort': 'Sort',
    'filters.sortRelevance': 'Most relevant',
    'filters.sortPriceLow': 'Price: low to high',
    'filters.sortPriceHigh': 'Price: high to low',
    'filters.apply': 'Apply filters',
    'filters.clear': 'View all products',

    // Categories
    'categories.title': 'Categories',
    'categories.subtitle':
      'Explore our religious art categories and discover collections for every devotion.',
    'categories.loading': 'Loading categories...',

    // Techniques
    'techniques.title': 'Techniques',
    'techniques.subtitle':
      'Explore our artistic techniques and discover works created with different methods.',
    'techniques.loading': 'Loading techniques...',
    'techniques.noTechniques': 'No techniques available.',
    'techniques.noProducts': 'No products with this technique.',
    'techniques.backToProducts': 'Back to products',

    // Artists
    'artists.title': 'Artists',
    'artists.subtitle': 'Meet our artists and their collections.',
    'artists.loading': 'Loading artists...',
    'artists.noResults': 'No artists for the selected type.',
    'artists.all': 'All',

    // Cart
    'cart.title': 'Shopping Cart',
    'cart.empty': 'Your cart is empty',
    'cart.quantity': 'Quantity:',
    'cart.summary': 'Order Summary',
    'cart.subtotal': 'Subtotal',
    'cart.item': 'item',
    'cart.items': 'items',
    'cart.shipping': 'Shipping',
    'cart.total': 'Total',
    'cart.clear': 'Clear Cart',

    // Product detail
    'productDetail.back': '← Back to products',
    'productDetail.backToCatalog': 'Back to catalog',
    'productDetail.fullscreen': 'View fullscreen image',
    'productDetail.category': 'Category:',
    'productDetail.noDescription': 'Description coming soon.',
    'productDetail.shippingEstimate': 'Delivery estimate',
    'productDetail.shippingFrom': 'Shipping from',
    'productDetail.measures': 'Dimensions: width × height × depth in centimeters',
    'productDetail.techniques': 'Techniques',
    'productDetail.materialDetail': 'Material detail:',
    'productDetail.shippingCalendar': 'Shipping calendar',

    // Category detail
    'categoryDetail.noProducts': 'No products for the selected category.',
    'categoryDetail.backToCategories': 'Back to categories',
    'categoryDetail.paginationLast': 'Last »',

    // Login
    'login.welcome': 'Welcome to Arte Católica',
    'login.subtitle': 'Log in or create your account',
    'login.google': 'Continue with Google',
    'login.apple': 'Continue with Apple',
    'login.email': 'Email',
    'login.password': 'Password',
    'login.passwordMin': 'Password must be at least 6 characters',
    'login.invalidEmail': 'Invalid email',
    'login.name': 'First name',
    'login.surname': 'Last name',
    'login.minChars': 'Min 6 characters',
    'login.signIn': 'Log in',
    'login.createAccount': 'Create account',
    'login.signInLink': 'Log in',

    // Profile
    'profile.title': 'My Personal Area',
    'profile.choose': 'Choose your profile type',
    'profile.buyer': 'Buyer',
    'profile.seller': 'Seller',
    'profile.buyerDesc': 'Manage your orders, favorites and delivery addresses',
    'profile.sellerDesc': 'Manage your products, orders and professional data',
    'profile.personalData': 'My personal data',

    // Pagination
    'pagination.first': '« First',
    'pagination.prev': '‹',
    'pagination.next': '›',
    'pagination.last': 'Last »',

    // Home
    'home.welcome': 'Welcome to Arte Católica',
    'home.subtitle': 'Discover the beauty of sacred art and Catholic tradition',
    'home.explore': 'Explore our collection of religious and sacred art',
    'home.education': 'Education',
    'home.educationDesc': 'Learn about the symbolism and meaning of religious art',

    // Availability
    'availability.inStock': 'In stock',
    'availability.limited': 'Limited stock',
    'availability.onDemand': 'On demand',

    // Misc
    'news.readMore': 'Read more →',
    'productCard.shippingFrom': 'Delivery from',
  },
};
