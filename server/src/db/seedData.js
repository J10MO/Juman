// All dimensions are in metres: w = width (x), d = depth (z), h = height (y).
// kind: floor = stands on the floor and collides, rug = lies under everything,
// small = can sit on any product that has a surface_height.

export const categories = [
  { slug: 'living', name: 'الصالة والهول', blurb: 'قنفات وكراسي وميزات تخلي الگعدة وية الأهل أحلى', sort: 1 },
  { slug: 'bedroom', name: 'غرفة النوم', blurb: 'سرير مريح وكنتور يلم كل شي', sort: 2 },
  { slug: 'dining', name: 'الطعام', blurb: 'ميز يلم العايلة كلها على الغدا', sort: 3 },
  { slug: 'kitchen', name: 'المطبخ', blurb: 'كاونتر وثلاجة وطباخ، كل شي يحتاجه المطبخ', sort: 4 },
  { slug: 'bathroom', name: 'الحمام', blurb: 'مغاسل وبانيو وتواليت بخامات تلمع', sort: 5 },
  { slug: 'office', name: 'المكتب والقراية', blurb: 'زاوية هادئة للشغل والدراسة', sort: 6 },
  { slug: 'rugs', name: 'السجاد والزوالي', blurb: 'تبريزي، كليم، مغربي، فرو، وسجادة صلاة', sort: 7 },
  { slug: 'decor', name: 'الديكور والإنارة', blurb: 'التفاصيل الصغيرة اللي تفرق هواية', sort: 8 },
  { slug: 'appliances', name: 'الأجهزة', blurb: 'مبردة للصيف، صوبة للشتا، وپانكة لكل وقت', sort: 9 },
]

export const products = [
  {
    slug: 'dijla-sofa', name: 'قنفة دجلة', category: 'living', price: 850000, model_key: 'sofa',
    description: 'قنفة ثلاث گعدات، إسفنجها عالي الكثافة وقماشها ناعم ويتحمل. تگعد عليها وتنسى نفسك، وتصير مركز الصالة.',
    colors: ['#3e5c6e', '#9c4a2f', '#cdbfa6', '#38463a'], dims: { w: 2.2, d: 0.95, h: 0.85 },
    kind: 'floor', featured: true, sort: 1,
  },
  {
    slug: 'shatt-armchair', name: 'كرسي الشط', category: 'living', price: 320000, model_key: 'armchair',
    description: 'كرسي مفرد بظهر عالي وأيادي عريضة، كلش مناسب لگعدة الشاي العصرية يم الشباك.',
    colors: ['#b0794a', '#3e5c6e', '#d8d0c2', '#5b3a4a'], dims: { w: 0.85, d: 0.85, h: 0.92 },
    kind: 'floor', featured: true, sort: 2,
  },
  {
    slug: 'karrada-coffee-table', name: 'ميز قهوة الكرادة', category: 'living', price: 185000, model_key: 'coffee-table',
    description: 'ميز وسط من خشب الجوز ورجول معدن. تگدر تحط عليه الإبريق والكاسات أو مزهرية حلوة.',
    colors: ['#8a5a3b', '#c49a6c', '#3b2a20'], dims: { w: 1.1, d: 0.6, h: 0.42 },
    kind: 'floor', surface_height: 0.42, featured: true, sort: 3,
  },
  {
    slug: 'mutanabbi-tv-unit', name: 'ميز تلفزيون الأعظمية', category: 'living', price: 410000, model_key: 'tv-unit',
    description: 'وحدة تلفزيون واطية بأدراج مخفية، وياها شاشة ٦٥ إنش. خلي الريموت بمكانه ولا تخليه يضيع.',
    colors: ['#c49a6c', '#ece6dc', '#2b2b2b'], dims: { w: 1.8, d: 0.45, h: 0.5 },
    kind: 'floor', sort: 4,
  },
  {
    slug: 'babil-side-table', name: 'ميز جانبي بابل', category: 'living', price: 95000, model_key: 'side-table',
    description: 'ميز صغير مدور يجي يم القنفة، تحط عليه الفانوس أو الموبايل ويا گلاص الچاي.',
    colors: ['#8a5a3b', '#d9c3a0', '#2f2f2f'], dims: { w: 0.5, d: 0.5, h: 0.55 },
    kind: 'floor', surface_height: 0.55, sort: 5,
  },
  {
    slug: 'basra-ottoman', name: 'بف البصرة', category: 'living', price: 75000, model_key: 'ottoman',
    description: 'بف مدور ومنفوخ، تمد رجلك عليه أو يصير گعدة إضافية من يجون الخطار.',
    colors: ['#c8a45c', '#3e5c6e', '#9c4a2f', '#e8e1d5'], dims: { w: 0.55, d: 0.55, h: 0.42 },
    kind: 'floor', sort: 6,
  },
  {
    slug: 'mansour-bed', name: 'سرير المنصور', category: 'bedroom', price: 1150000, model_key: 'bed',
    description: 'سرير نفرين بظهر منجّد ومرتبة طبية. نومة ملوك، وتگعد الصبح مرتاح.',
    colors: ['#cdbfa6', '#3e5c6e', '#6d5a4b', '#e3dcd2'], dims: { w: 1.7, d: 2.15, h: 1.15 },
    kind: 'floor', featured: true, sort: 1,
  },
  {
    slug: 'kantoor-wardrobe', name: 'كنتور الحلة', category: 'bedroom', price: 690000, model_key: 'wardrobe',
    description: 'كنتور بثلاث أبواب ورفوف وعلاگة. يلم الهدوم كلها، ويخلص النقاش على منو ياخذ أكثر مكان.',
    colors: ['#c49a6c', '#ece6dc', '#6b4a33'], dims: { w: 1.6, d: 0.6, h: 2.1 },
    kind: 'floor', sort: 2,
  },
  {
    slug: 'najaf-nightstand', name: 'كومودينو النجف', category: 'bedroom', price: 120000, model_key: 'nightstand',
    description: 'كومودينو بدرجين، يجي يم السرير وتحط عليه الفانوس وكتابك.',
    colors: ['#c49a6c', '#ece6dc', '#6b4a33'], dims: { w: 0.5, d: 0.42, h: 0.55 },
    kind: 'floor', surface_height: 0.55, sort: 3,
  },
  {
    slug: 'family-dining-table', name: 'ميز طعام العائلة', category: 'dining', price: 560000, model_key: 'dining-table',
    description: 'ميز طعام لستة أشخاص من الخشب الصلب. على هذا الميز تنحل كل مشاكل العايلة وية صينية الدولمة.',
    colors: ['#8a5a3b', '#c49a6c', '#4a3426'], dims: { w: 1.8, d: 0.9, h: 0.76 },
    kind: 'floor', surface_height: 0.76, featured: true, sort: 1,
  },
  {
    slug: 'dining-chair', name: 'كرسي طعام', category: 'dining', price: 85000, model_key: 'dining-chair',
    description: 'كرسي بگعدة منجدة وظهر منحني مريح. اشتري ستة وخلص.',
    colors: ['#cdbfa6', '#3e5c6e', '#9c4a2f'], dims: { w: 0.46, d: 0.52, h: 0.9 },
    kind: 'floor', sort: 2,
  },
  {
    slug: 'study-desk', name: 'ميز دراسة الجادرية', category: 'office', price: 240000, model_key: 'desk',
    description: 'ميز دراسة بدرج جانبي ومساحة واسعة للابتوب. للطلاب والشغل من البيت.',
    colors: ['#c49a6c', '#ece6dc', '#3b2a20'], dims: { w: 1.2, d: 0.6, h: 0.75 },
    kind: 'floor', surface_height: 0.75, sort: 1,
  },
  {
    slug: 'mutanabbi-bookshelf', name: 'مكتبة المتنبي', category: 'office', price: 275000, model_key: 'bookshelf',
    description: 'مكتبة بخمس رفوف، تستاهلها كتبك اللي جبتها من شارع المتنبي يوم الجمعة.',
    colors: ['#8a5a3b', '#ece6dc', '#3b2a20'], dims: { w: 1.0, d: 0.35, h: 1.9 },
    kind: 'floor', sort: 2,
  },
  {
    slug: 'zawiya-rug', name: 'زولية الزاوية', category: 'rugs', price: 230000, model_key: 'rug',
    description: 'زولية منقوشة بنقشة تراثية. تدفّي القاع وتلم الگعدة. تنفرش جوة القنفة والميز.',
    colors: ['#8e2f2a', '#2e4a62', '#7a6a3a'], dims: { w: 2.4, d: 1.7, h: 0.012 },
    kind: 'rug', featured: true, sort: 1, material: 'صوف ممزوج',
  },
  {
    slug: 'olive-tree', name: 'شتلة زيتون', category: 'decor', price: 65000, model_key: 'olive-tree',
    description: 'شجرة زيتون بسندانة فخار، تنطي روح وخضار لأي زاوية بالبيت.',
    colors: ['#b5643c', '#e9e4dc', '#2f2f2f'], dims: { w: 0.5, d: 0.5, h: 1.45 },
    kind: 'floor', sort: 2,
  },
  {
    slug: 'floor-lamp', name: 'فانوس أرضي', category: 'decor', price: 110000, model_key: 'floor-lamp',
    description: 'فانوس أرضي بضوء أصفر دافي. شغّله بالليل وشوف شلون تتغير الگعدة.',
    colors: ['#f1e6d0', '#2f2f2f', '#c8a45c'], dims: { w: 0.42, d: 0.42, h: 1.65 },
    kind: 'floor', sort: 3,
  },
  {
    slug: 'table-lamp', name: 'فانوس ميز', category: 'decor', price: 55000, model_key: 'table-lamp',
    description: 'فانوس صغير تحطه فوگ الكومودينو أو الميز الجانبي. اسحبه وذبه فوگ أي ميز.',
    colors: ['#f1e6d0', '#c8a45c', '#3e5c6e'], dims: { w: 0.26, d: 0.26, h: 0.46 },
    kind: 'small', sort: 4,
  },
  {
    slug: 'clay-vase', name: 'مزهرية فخار', category: 'decor', price: 30000, model_key: 'vase',
    description: 'مزهرية فخار مصنوعة باليد ووياها أغصان يابسة. حطها فوگ ميز القهوة وشوف الفرق.',
    colors: ['#b5643c', '#e9e4dc', '#2e4a62'], dims: { w: 0.2, d: 0.2, h: 0.48 },
    kind: 'small', sort: 5,
  },
  {
    slug: 'small-plant', name: 'سندانة صغيرة', category: 'decor', price: 25000, model_key: 'small-plant',
    description: 'زرع صغير بسندانة سيراميك، مقاسه يجي فوگ الميز أو رف المكتبة.',
    colors: ['#e9e4dc', '#2f2f2f', '#b5643c'], dims: { w: 0.22, d: 0.22, h: 0.34 },
    kind: 'small', sort: 6,
  },

  // ---------- kitchen ----------
  {
    slug: 'kitchen-counter', name: 'كاونتر مطبخ ويا مغسلة', category: 'kitchen', price: 1850000, model_key: 'kitchen-counter',
    description: 'كاونتر مطبخ ٢٤٠ سم بسطح حجر، ومغسلة ستيل وحنفية، ودواليب فوگ وجوة. ينفصّل حسب قياس مطبخك.',
    colors: ['#f2efe9', '#3e5c6e', '#c49a6c', '#38463a'], dims: { w: 2.4, d: 0.62, h: 0.9 },
    kind: 'floor', surface_height: 0.9, featured: true, sort: 1, material: 'خشب MDF مصبوغ وسطح كوارتز',
  },
  {
    slug: 'fridge', name: 'ثلاجة نوفروست', category: 'kitchen', price: 1350000, model_key: 'fridge',
    description: 'ثلاجة بابين، الفريزر فوگ والثلاجة جوة. نوفروست ما يحتاج تذوّب الثلج كل شهر.',
    colors: ['#c9ccd1', '#f4f2ee', '#2b2b2b'], dims: { w: 0.75, d: 0.72, h: 1.85 },
    kind: 'floor', sort: 2, material: 'ستيل وبلاستك',
  },
  {
    slug: 'gas-stove', name: 'طباخ غاز ٥ عيون', category: 'kitchen', price: 520000, model_key: 'stove',
    description: 'طباخ غاز بخمس عيون وفرن بباب زجاج. العين الوسطانية الكبيرة للجدر الكبير مال الدولمة.',
    colors: ['#c9ccd1', '#f4f2ee', '#2b2b2b'], dims: { w: 0.9, d: 0.6, h: 0.9 },
    kind: 'floor', sort: 3, material: 'ستيل مقاوم للصدأ',
  },
  {
    slug: 'washing-machine', name: 'غسالة أوتوماتيك', category: 'kitchen', price: 680000, model_key: 'washing-machine',
    description: 'غسالة فتحة أمامية ٨ كيلو. تغسل وتعصر، وإنتَ مرتاح.',
    colors: ['#f4f2ee', '#c9ccd1', '#2b2b2b'], dims: { w: 0.6, d: 0.6, h: 0.85 },
    kind: 'floor', surface_height: 0.85, sort: 4, material: 'معدن مطلي وزجاج',
  },
  // ---------- bathroom ----------
  {
    slug: 'toilet', name: 'تواليت افرنجي', category: 'bathroom', price: 260000, model_key: 'toilet',
    description: 'تواليت سيراميك بخزان مخفي الصوت، وياه شطّاف جانبي.',
    colors: ['#f4f2ee', '#e9e4dc', '#2b2b2b'], dims: { w: 0.42, d: 0.68, h: 0.8 },
    kind: 'floor', sort: 1, material: 'سيراميك',
  },
  {
    slug: 'vanity', name: 'مغسلة ويا مراية', category: 'bathroom', price: 430000, model_key: 'vanity',
    description: 'مغسلة سيراميك على كابينة خشب بابين، وفوگها مراية بإطار نحاسي.',
    colors: ['#c49a6c', '#f2efe9', '#3e5c6e', '#38463a'], dims: { w: 0.8, d: 0.5, h: 1.95 },
    kind: 'floor', sort: 2, material: 'خشب مقاوم للرطوبة وسيراميك',
  },
  {
    slug: 'bathtub', name: 'بانيو', category: 'bathroom', price: 890000, model_key: 'bathtub',
    description: 'بانيو أكريليك على رجول نحاس. تتحمم براحة وتنسى تعب اليوم.',
    colors: ['#f4f2ee', '#2e4a62', '#38463a'], dims: { w: 1.7, d: 0.78, h: 0.6 },
    kind: 'floor', sort: 3, material: 'أكريليك ونحاس',
  },
  // ---------- appliances ----------
  {
    slug: 'air-cooler', name: 'مبردة هواء', category: 'appliances', price: 340000, model_key: 'air-cooler',
    description: 'مبردة صحراوية بكاغد من ثلاث جهات وماطور قوي. بلا مبردة ماكو صيف بالعراق.',
    colors: ['#e6e1d6', '#d9dde3', '#cfa77a'], dims: { w: 0.72, d: 0.56, h: 1.15 },
    kind: 'floor', featured: true, sort: 1, material: 'بلاستك مقاوم وكاغد تبريد',
  },
  {
    slug: 'aladdin-heater', name: 'صوبة علاء الدين', category: 'appliances', price: 165000, model_key: 'heater',
    description: 'صوبة نفط علاء الدين الزرگة الأصلية. ريحتها ودفاها ذكريات شتا كاملة، وتولّع بوضع الليل.',
    colors: ['#2f6db5', '#8e2f2a', '#38463a'], dims: { w: 0.42, d: 0.42, h: 0.62 },
    kind: 'floor', sort: 2, material: 'حديد مطلي مينا',
  },
  {
    slug: 'floor-fan', name: 'پانكة أرضية', category: 'appliances', price: 75000, model_key: 'floor-fan',
    description: 'پانكة أرضية بثلاث ريش وتدور يمين ويسار. شغّالة بالموقع هم، شوفها تدور!',
    colors: ['#f4f2ee', '#2b2b2b', '#3e5c6e'], dims: { w: 0.44, d: 0.44, h: 1.3 },
    kind: 'floor', sort: 3, material: 'بلاستك وحديد',
  },

  // ---------- rugs (procedural designs: model_key "rug:<pattern>") ----------
  {
    slug: 'tabriz-rug', name: 'زولية تبريزي كبيرة', category: 'rugs', price: 690000, model_key: 'rug:tabriz',
    description: 'زولية تبريزي بنقشة الصُرّة بالنص وإطار عريض. حجمها كبير يلم صالة كاملة، وتعيش عشرين سنة.',
    colors: ['#7a1f24', '#1f3a5f', '#5b4636'], dims: { w: 3.0, d: 2.0, h: 0.014 },
    kind: 'rug', featured: true, sort: 2, material: 'صوف طبيعي، عقد يدوي',
  },
  {
    slug: 'kilim-rug', name: 'بساط كليم', category: 'rugs', price: 260000, model_key: 'rug:kilim',
    description: 'بساط منسوج نسج مسطح بمثلثات ومعينات ملونة. خفيف ويتغسل، يصلح للهول والممرات.',
    colors: ['#b5442f', '#2e5e6e', '#c8902e'], dims: { w: 2.0, d: 1.4, h: 0.008 },
    kind: 'rug', sort: 3, material: 'صوف وقطن، نسج يدوي',
  },
  {
    slug: 'moroccan-rug', name: 'زولية مغربية', category: 'rugs', price: 420000, model_key: 'rug:beni',
    description: 'زولية بيضة منفوشة بخطوط معينات مرسومة باليد، على طريقة بني ورين المغربية. ناعمة على الرجل.',
    colors: ['#2b2b2b', '#6b4a33', '#3e5c6e'], dims: { w: 2.3, d: 1.6, h: 0.025 },
    kind: 'rug', sort: 4, material: 'صوف أبيض منفوش',
  },
  {
    slug: 'modern-rug', name: 'زولية مودرن', category: 'rugs', price: 340000, model_key: 'rug:modern',
    description: 'زولية بدوائر وأقواس ناعمة بألوان هادية. تمشي ويا القنفات العصرية والحيطان الفاتحة.',
    colors: ['#8fa3a8', '#c9a27a', '#a3a18a'], dims: { w: 2.2, d: 1.6, h: 0.012 },
    kind: 'rug', sort: 5, material: 'بوليستر ناعم مضاد للبقع',
  },
  {
    slug: 'round-rug', name: 'زولية مدورة', category: 'rugs', price: 310000, model_key: 'rug:round',
    description: 'زولية مدورة بنقشة وردة بالنص. تجي حلوة جوة ميز القهوة المدور أو بغرفة النوم.',
    colors: ['#2e4a62', '#8e2f2a', '#3f5e45'], dims: { w: 1.8, d: 1.8, h: 0.012 },
    kind: 'rug', sort: 6, material: 'صوف وحرير صناعي',
  },
  {
    slug: 'hall-runner', name: 'مدّة ممر', category: 'rugs', price: 210000, model_key: 'rug:runner',
    description: 'زولية طويلة وضيقة للممر والمطبخ بنقشة متكررة. تحمي القاع وتدفّي المشية.',
    colors: ['#7a1f24', '#1f3a5f', '#4a5a3a'], dims: { w: 3.0, d: 0.8, h: 0.012 },
    kind: 'rug', sort: 7, material: 'صوف، عقد آلي',
  },
  {
    slug: 'bedouin-stripes', name: 'بساط بدوي مخطط', category: 'rugs', price: 190000, model_key: 'rug:stripes',
    description: 'بساط بخطوط عريضة وضيقة بألوان البادية. مكانه بالديوانية ويا المساند.',
    colors: ['#a3312a', '#2e4a62', '#c8902e'], dims: { w: 1.8, d: 1.2, h: 0.008 },
    kind: 'rug', sort: 8, material: 'صوف ماعز، نسج يدوي',
  },
  {
    slug: 'shaggy-rug', name: 'زولية فرو', category: 'rugs', price: 280000, model_key: 'rug:shaggy',
    description: 'زولية فرو منفوشة كلش ناعمة. للگعدة على القاع بغرفة النوم والشتا.',
    colors: ['#e9e4dc', '#8a8f96', '#c4a484', '#d8a7a7'], dims: { w: 2.0, d: 1.5, h: 0.035 },
    kind: 'rug', sort: 9, material: 'بوليستر فرو طويل',
  },
  {
    slug: 'kids-rug', name: 'زولية أطفال', category: 'rugs', price: 150000, model_key: 'rug:kids',
    description: 'زولية لعب بيها شارع وبيوت وأشجار. الجهال يلعبون عليها بالسيارات ساعات.',
    colors: ['#9ecbd9', '#f2c6a0', '#c9b8e0'], dims: { w: 2.0, d: 1.4, h: 0.012 },
    kind: 'rug', sort: 10, material: 'نايلون ناعم وقاعدة مانعة للتزحلق',
  },
  {
    slug: 'prayer-rug', name: 'سجادة صلاة', category: 'rugs', price: 45000, model_key: 'rug:prayer',
    description: 'سجادة صلاة بمحراب وقنديل وإطار منقوش. تنطوي وتنحط بالكنتور.',
    colors: ['#1f5e4a', '#7a1f24', '#2e4a62'], dims: { w: 1.15, d: 0.7, h: 0.01 },
    kind: 'rug', sort: 11, material: 'قطيفة ناعمة',
  },
  {
    slug: 'bath-mat', name: 'دواسة حمام', category: 'rugs', price: 20000, model_key: 'rug:bath',
    description: 'دواسة قطن تمتص الماي، تنحط يم البانيو أو باب الحمام.',
    colors: ['#b7c4cf', '#e9e4dc', '#9db8a0'], dims: { w: 0.8, d: 0.5, h: 0.015 },
    kind: 'rug', sort: 12, material: 'قطن ١٠٠٪',
  },

  // ---------- contemporary collection (built in code) ----------
  // stone colours: #f1efeb carrara, #1d1d1f nero, #2f4a3e verde, #e9d6cc rosa, #d9c7aa travertine
  {
    slug: 'nuvola-sofa', name: 'قنفة نوفولا بوكليه', category: 'living', price: 1950000, model_key: 'modern-sofa',
    description: 'قنفة واطية وعميقة بقماش بوكليه ناعم ومخدات منفوشة. ستايل عصري هادي، تگعد بيها وتغطس.',
    colors: ['#eae4d8', '#a9b5a0', '#c9b49a', '#6f7a86'], dims: { w: 2.4, d: 1.0, h: 0.76 },
    kind: 'floor', featured: true, sort: 0, material: 'قماش بوكليه وإسفنج عالي الكثافة',
  },
  {
    slug: 'corner-sectional', name: 'قنفة زاوية L', category: 'living', price: 3200000, model_key: 'sectional',
    description: 'قنفة زاوية كبيرة ويا شيزلونگ تمد عليه رجلك. تلم العايلة كلها قدام التلفزيون.',
    colors: ['#d8d2c6', '#8a8f96', '#b9a48a', '#4f5b4a'], dims: { w: 2.9, d: 1.75, h: 0.78 },
    kind: 'floor', featured: true, sort: 0, material: 'قماش كتان مضاد للبقع',
  },
  {
    slug: 'luna-chair', name: 'كرسي لونا المدور', category: 'living', price: 720000, model_key: 'curve-chair',
    description: 'كرسي مدور ناعم بقماش بوكليه، يحتضنك من كل الجهات. قطعة تخطف العين بأي زاوية.',
    colors: ['#efe9de', '#c9b49a', '#a9b5a0', '#e3c9c0'], dims: { w: 0.82, d: 0.82, h: 0.74 },
    kind: 'floor', featured: true, sort: 0, material: 'بوكليه وإطار خشب صلب',
  },
  {
    slug: 'cloud-pouf', name: 'بف غيمة', category: 'living', price: 180000, model_key: 'boucle-pouf',
    description: 'بف مدور منفوش مثل الغيمة، للگعدة الزايدة أو تحط عليه رجلك.',
    colors: ['#efe9de', '#c9b49a', '#a9b5a0'], dims: { w: 0.55, d: 0.55, h: 0.4 },
    kind: 'floor', sort: 0, material: 'بوكليه',
  },
  {
    slug: 'marble-coffee-table', name: 'ميز وسط مرمر', category: 'living', price: 980000, model_key: 'marble-coffee',
    description: 'ميز وسط بسطح مرمر سميك على قاعدتين مدورات. ثقيل وفخم ويعيش عمر.',
    colors: ['#f1efeb', '#d9c7aa', '#1d1d1f', '#2f4a3e'], dims: { w: 1.25, d: 0.65, h: 0.34 },
    kind: 'floor', surface_height: 0.34, featured: true, sort: 0, material: 'مرمر طبيعي',
  },
  {
    slug: 'nesting-stone-tables', name: 'ميزات متداخلة حجر', category: 'living', price: 640000, model_key: 'nesting-tables',
    description: 'ميزين مدورات واحد يدخل جوة الثاني. تفتحهن من يجون الخطار وتلمهن بعدين.',
    colors: ['#d9c7aa', '#f1efeb', '#e9d6cc'], dims: { w: 1.1, d: 0.8, h: 0.42 },
    kind: 'floor', surface_height: 0.42, sort: 0, material: 'ترافرتين ومرمر',
  },
  {
    slug: 'arc-floor-lamp', name: 'فانوس قوس', category: 'decor', price: 390000, model_key: 'arc-lamp',
    description: 'فانوس أرضي بقوس ستيل يوصل فوگ القنفة، وقاعدة مرمر أسود. يضوي بالليل ضوي دافي.',
    colors: ['#c8a45c', '#1b1b1d', '#efe9de'], dims: { w: 0.32, d: 0.32, h: 2.05 },
    kind: 'floor', featured: true, sort: 0, material: 'ستيل ومرمر',
  },
  {
    slug: 'fluted-tv-wall', name: 'وحدة تلفزيون جدارية', category: 'living', price: 1650000, model_key: 'tv-wall',
    description: 'جدار خشب مخدد ويا كابينة معلگة وإضاءة مخفية جوة. تخفي الأسلاك وتخلي الصالة كأنها فندق.',
    colors: ['#c9a377', '#8a5a3b', '#3b2a20'], dims: { w: 2.4, d: 0.42, h: 2.2 },
    kind: 'floor', featured: true, sort: 0, material: 'خشب جوز وطبقة ترافرتين',
  },
  {
    slug: 'fluted-sideboard', name: 'بوفيه مخدد عصري', category: 'living', price: 920000, model_key: 'sideboard',
    description: 'بوفيه واطي بأبواب خشب مخدد وسطح ترافرتين. البديل العصري لبوفيه أبو زجاج.',
    colors: ['#c9a377', '#8a5a3b', '#3b2a20'], dims: { w: 1.8, d: 0.45, h: 0.78 },
    kind: 'floor', surface_height: 0.78, sort: 0, material: 'خشب بلوط وترافرتين',
  },
  {
    slug: 'linen-platform-bed', name: 'سرير منصة كتان', category: 'bedroom', price: 1450000, model_key: 'platform-bed',
    description: 'سرير واطي بظهر منجّد بقنوات طولية. تصميم هادي ونومة مريحة.',
    colors: ['#d8d2c6', '#b9a48a', '#7d8a7a', '#3e4a5a'], dims: { w: 1.9, d: 2.2, h: 1.15 },
    kind: 'floor', featured: true, sort: 0, material: 'قماش كتان ومرتبة طبية',
  },
  {
    slug: 'oak-nightstand', name: 'كومودينو بلوط عصري', category: 'bedroom', price: 230000, model_key: 'modern-nightstand',
    description: 'كومودينو بحواف مدورة على رجول نحاسية رفيعة. يجي يم السرير ويحمل الفانوس والكتاب.',
    colors: ['#c9a377', '#8a5a3b', '#efe9de'], dims: { w: 0.5, d: 0.4, h: 0.55 },
    kind: 'floor', surface_height: 0.55, sort: 0, material: 'خشب بلوط ونحاس',
  },
  {
    slug: 'sliding-wardrobe', name: 'كنتور أبواب سحّابة', category: 'bedroom', price: 1350000, model_key: 'sliding-wardrobe',
    description: 'كنتور بأبواب سحّابة، باب خشب وباب مراية برونزية. يوفر مكان ويكبّر الغرفة.',
    colors: ['#c9a377', '#efe9de', '#3b2a20'], dims: { w: 2.0, d: 0.62, h: 2.4 },
    kind: 'floor', sort: 0, material: 'خشب ومراية برونزية',
  },
  {
    slug: 'arch-mirror', name: 'مراية قوس أرضية', category: 'decor', price: 260000, model_key: 'floor-mirror',
    description: 'مراية طويلة بإطار ذهبي على شكل قوس، تتسند على الحايط وتكبّر الغرفة.',
    colors: ['#c8a45c', '#1b1b1d', '#c9ccd1'], dims: { w: 0.7, d: 0.12, h: 1.8 },
    kind: 'floor', sort: 0, material: 'مراية وإطار معدن',
  },
  {
    slug: 'oval-marble-dining', name: 'ميز طعام مرمر بيضوي', category: 'dining', price: 2400000, model_key: 'marble-dining',
    description: 'ميز طعام بيضوي بسطح مرمر وقاعدتين منحوتات. لثمانية أشخاص، وقطعة فنية بنص البيت.',
    colors: ['#f1efeb', '#d9c7aa', '#1d1d1f', '#2f4a3e'], dims: { w: 2.2, d: 1.05, h: 0.75 },
    kind: 'floor', surface_height: 0.75, featured: true, sort: 0, material: 'مرمر طبيعي',
  },
  {
    slug: 'shell-dining-chair', name: 'كرسي صدفة', category: 'dining', price: 210000, model_key: 'shell-chair',
    description: 'كرسي طعام بقشرة منحنية على رجول بلوط ومخدة ناعمة. خفيف وعملي وبألوان هادية.',
    colors: ['#efe9de', '#a9b5a0', '#c9b49a', '#3e4a5a'], dims: { w: 0.52, d: 0.54, h: 0.8 },
    kind: 'floor', sort: 0, material: 'بلاستك مقوّى ورجول بلوط',
  },
  {
    slug: 'waterfall-island', name: 'جزيرة مطبخ مرمر', category: 'kitchen', price: 2900000, model_key: 'kitchen-island',
    description: 'جزيرة مطبخ بمرمر نازل على الجهتين وواجهة خشب مخدد. تحضّر الأكل عليها وتفطر يمها.',
    colors: ['#f1efeb', '#1d1d1f', '#2f4a3e'], dims: { w: 2.2, d: 0.95, h: 0.92 },
    kind: 'floor', surface_height: 0.92, featured: true, sort: 0, material: 'مرمر وخشب بلوط',
  },
  {
    slug: 'counter-stool', name: 'كرسي بار بوكليه', category: 'kitchen', price: 160000, model_key: 'modern-stool',
    description: 'كرسي عالي بگعدة بوكليه مدورة ورجول حديد سود. ينحط يم الجزيرة.',
    colors: ['#efe9de', '#c9b49a', '#6f7a86'], dims: { w: 0.42, d: 0.42, h: 0.75 },
    kind: 'floor', sort: 0, material: 'بوكليه وحديد',
  },
  {
    slug: 'oak-sled-desk', name: 'ميز مكتب بلوط', category: 'office', price: 560000, model_key: 'modern-desk',
    description: 'ميز مكتب بسطح بلوط ورجول حديد سود ومجرى للأسلاك. للشغل من البيت براحة.',
    colors: ['#c9a377', '#efe9de', '#3b2a20'], dims: { w: 1.4, d: 0.7, h: 0.75 },
    kind: 'floor', surface_height: 0.75, featured: true, sort: 0, material: 'خشب بلوط وحديد',
  },
  {
    slug: 'ergo-chair', name: 'كرسي مكتب طبي', category: 'office', price: 380000, model_key: 'office-chair',
    description: 'كرسي مكتب بظهر شبك يتنفس ومساند إيد وعجلات. يريح ظهرك بالساعات الطويلة.',
    colors: ['#2b2b2b', '#6f7a86', '#efe9de'], dims: { w: 0.66, d: 0.66, h: 1.15 },
    kind: 'floor', sort: 0, material: 'شبك وقماش وألمنيوم',
  },
  {
    slug: 'open-shelf', name: 'رفوف مفتوحة حديد', category: 'office', price: 420000, model_key: 'modern-shelf',
    description: 'رفوف مفتوحة بإطار حديد أسود ورفوف خشب، ويا كتب وتحف جاهزة.',
    colors: ['#c9a377', '#3b2a20', '#efe9de'], dims: { w: 1.2, d: 0.36, h: 1.85 },
    kind: 'floor', sort: 0, material: 'حديد وخشب',
  },
]
