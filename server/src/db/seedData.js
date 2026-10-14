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
]
