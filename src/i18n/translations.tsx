import { Code2, Server, HeartHandshake, Wrench } from 'lucide-react';
import type { TranslationType } from '../types/i18n';

export const translations: { [key: string]: TranslationType } = {
  pt: {
    nav: { manifesto: "Manifesto", product: "SafraSense", network: "Raiznet", waitlist: "Espera", faq: "FAQ", contact: "Contato", store: "Loja" },
    hero: {
      title: "Soluções Confiáveis.",
      subtitle: "Você define como usar.",
      desc: "Produtos desenvolvidos de maneira aberta. Tenha acesso aos esquemas elétricos, ao código-fonte e a cada peça de reposição. Assuma o controle absoluto: construímos soluções focadas em privacidade, segurança e ética."
    },
    manifesto: {
      title: "Manifesto pela Autonomia",
      items: [
        { 
          title: "Conhecimento Aberto", 
          desc: "Acreditamos que quem confia em suas soluções as desenvolve de maneira aberta. A livre circulação do conhecimento é a via mais rápida e honesta de evolução. Não temos patentes: incentivamos que você compre os componentes e faça a montagem. Comercializamos a ideia pronta para quem tem pressa, além de componentes de reposição.",
          icon: <Code2 className="w-8 h-8 mb-6" />
        },
        { 
          title: "Liberdade para Expandir", 
          desc: "Você é livre para usar, modificar e expandir nossas tecnologias da maneira que julgar adequada. Nascemos sobre as bases sólidas da comunidade open-source e esperamos que nossos sistemas também cresçam na mesma. Garantimos que sua infraestrutura, hardware e privacidade estejam sempre sob o seu controle absoluto.",
          icon: <Server className="w-8 h-8 mb-6" />
        },
        { 
          title: "Competência como Defesa", 
          desc: "Ao abrirmos nosso código e esquemáticos, assumimos conscientemente o risco da concorrência criar cópias. Nossa única defesa é a nossa competência técnica, honestidade e transparência. Conquistamos o usuário oferecendo sempre o melhor equilíbrio entre custo-benefício, confiança e suporte impecável.",
          icon: <HeartHandshake className="w-8 h-8 mb-6" />
        },
        { 
          title: "Direito ao Reparo",
          desc: "Nossas soluções são modulares, projetadas para fácil manutenção e funcionamento duradouro. Repudiamos a obsolescência programada: fornecemos todas as peças de reposição e as instruções necessárias para que você mesmo possa consertar, modificar e estender a vida útil do seu equipamento.",
          icon: <Wrench className="w-8 h-8 mb-6" />
        }
      ]
    },
    safra: {
      tag: "LANÇAMENTO",
      title: "SafraSense",
      desc: "Facilite, acelere e aumente sua plantação caseira que usa um sistema de hidroponia. Um sensor inteligente, autônomo e sem fios, projetado para monitorar seu cultivo e informar os melhores momentos para repor os nutrientes ou a água do sistema, além de auxiliar com outras manutenções comuns nesse tipo de cultivo.",
      features: [
        { title: "Métricas Vitais", desc: "Mede Condutividade Elétrica (EC), pH, temperatura, umidade e nível da água do reservatório." },
        { title: "Energia Solar", desc: "Independência total da rede elétrica. Painel solar integrado com bateria de alta capacidade." },
        { title: "Conectividade Flexível", desc: "Sincroniza dados via Wi-Fi diretamente com a sua rede local ou de forma integrada com a Raiznet." },
        { title: "Inteligência Analítica", desc: "Entenda o comportamento do seu cultivo. Leituras a cada 30 minutos são processadas para fornecer um histórico detalhado e insights precisos sobre a saúde da sua planta." },
        { title: "Comunidade", desc: "Opcionalmente ingresse na Raiznet, onde você define o que compartilha. Encontre pequenos agricultores na sua região. As possibilidades vão desde trocar plantios até compartilhar dados de sensores e colheitas para que a comunidade melhore suas produções em conjunto." }
      ],
      priceLabel: "Preço Estimado",
      price: "R$ 100 - R$ 200",
      cta: "Lista de Espera"
    },
    raiznet: {
      title: "Rede Raiznet",
      desc: "Não cultive isolado. A Raiznet é um ecossistema descentralizado que atua como um ponto de encontro para pequenos produtores locais. Qualquer pessoa pode se juntar à rede como produtor ou apenas visitante. Você pode configurar seu próprio servidor Raiznet privativo para ter visão e controle geral de múltiplos sensores, ou até mesmo hospedar um servidor público como o nosso.",
      nodes: [
        { title: "Nós Descentralizados", desc: "Cada SafraSense pode ser um nó na rede, compartilhando dados de produção de forma segura e anônima." },
        { title: "Autohospedável", desc: "Rode o servidor Raiznet na sua própria casa (num Raspberry Pi ou PC) e mantenha soberania total." },
        { title: "Inteligência Coletiva", desc: "Compartilhe guias de plantio, imagens e métodos de cultivo com outros produtores independentes." },
        { title: "Resiliência Local", desc: "Fortaleça a agricultura local e dependa menos de cadeias de suprimentos complexas. Descubra o que estão plantando perto de você para criar uma rede de abastecimento mais forte e independente." }
      ]
    },
    waitlist: {
      title: "Acesso Antecipado",
      desc: "A produção inicial do SafraSense (Aqua) será limitada para garantir a excelência no controle de qualidade. Junte-se à lista de espera para ter prioridade.",
      placeholder: "Seu melhor e-mail...",
      button: "Entrar na Lista",
      registering: "Registrando...",
      successMessage: "E-mail registrado, informaremos quando o produto estiver disponível."
    },
    faq: {
      title: "Perguntas Frequentes",
      items: [
        { q: "Quando o SafraSense estará disponível?", a: "A previsão de envio do primeiro lote é para o final deste semestre. Produzimos em pequena escala focando inteiramente na precisão do hardware." },
        { q: "O dispositivo precisa de internet o tempo todo?", a: "Não. O SafraSense pode operar de forma 100% offline, registrando os dados internamente e sincronizando apenas quando uma rede confiável for detectada." },
        { q: "Serve para plantio em terra/solo?", a: "Esta versão inicial (Aqua) foi projetada especificamente para reservatórios de hidroponia e aquaponia. Sensores de solo estão no nosso roadmap futuro." },
        { q: "Como acesso o código e os esquemáticos?", a: "Tudo será publicado no nosso repositório público sob uma licença open-source permissiva no dia do lançamento oficial. O poder é seu." }
      ]
    },
    footer: {
      rights: "Todos os direitos reservados.",
      contact: "Contato",
      address: "Endereço",
      social: "Redes Sociais"
    }
  },
  en: {
    nav: { manifesto: "Manifesto", product: "SafraSense", network: "Raiznet", waitlist: "Waitlist", faq: "FAQ", contact: "Contact", store: "Store" },
    hero: {
      title: "Reliable Solutions.",
      subtitle: "You define how to use them.",
      desc: "Products developed openly. Gain full access to electrical schematics, source code, and every replacement part. Take absolute control: we build solutions focused on privacy, security, and ethics."
    },
    manifesto: {
      title: "Manifesto for Autonomy",
      items: [
        { 
          title: "Open Knowledge", 
          desc: "We believe that those who trust their solutions build them openly. The free circulation of knowledge is the fastest and most honest path to evolution. We hold no patents: we encourage you to buy the components and assemble them yourself. We sell the ready-made idea for those in a hurry, as well as replacement components.",
          icon: <Code2 className="w-8 h-8 mb-6" />
        },
        { 
          title: "Freedom to Expand", 
          desc: "You are free to use, modify, and expand our technologies however you see fit. We are built on the solid foundations of the open-source community and hope our systems grow within it as well. We ensure your infrastructure, hardware, and privacy remain entirely under your absolute control.",
          icon: <Server className="w-8 h-8 mb-6" />
        },
        { 
          title: "Competence as Defense", 
          desc: "By opening our code and schematics, we consciously accept the risk of competitors cloning our work. Our only defense is our technical competence, honesty, and transparency. We win users over by always offering the best balance of cost-benefit, trust, and impeccable support.",
          icon: <HeartHandshake className="w-8 h-8 mb-6" />
        },
        {
          title: "Right to Repair",
          desc: "Our solutions are modular, designed for easy maintenance and long-lasting operation. We reject planned obsolescence: we provide all replacement parts and the necessary instructions so you can repair, modify, and extend the lifespan of your equipment yourself.",
          icon: <Wrench className="w-8 h-8 mb-6" />
        }
      ]
    },
    safra: {
      tag: "NEW RELEASE",
      title: "SafraSense",
      desc: "Simplify, accelerate, and grow your home hydroponic setup. A smart, autonomous, and wireless sensor designed to monitor your crops and notify you of the optimal moments to replenish system nutrients or water, while also assisting with other common maintenance tasks for this type of cultivation.",
      features: [
        { title: "Vital Metrics", desc: "Measures Electrical Conductivity (EC), pH, temperature, humidity, and water reservoir level." },
        { title: "Solar Powered", desc: "Total independence from the power grid. Integrated solar panel with a high-capacity battery." },
        { title: "Flexible Connectivity", desc: "Syncs data via Wi-Fi directly to your local network or seamlessly integrates with Raiznet." },
        { title: "Analytical Intelligence", desc: "Understand your crop's behavior. Readings taken every 30 minutes are processed to provide a detailed history and precise insights into your plant's health." },
        { title: "Community", desc: "Optionally join Raiznet, where you define what to share. Find small farmers in your region. Possibilities range from trading crops to sharing sensor and harvest data so the community can collectively improve yields." }
      ],
      priceLabel: "Estimated Price",
      price: "$20 - $40",
      cta: "Join Waitlist"
    },
    raiznet: {
      title: "Raiznet Network",
      desc: "Don't cultivate in isolation. Raiznet is a decentralized ecosystem that acts as a HUB for small local producers. Anyone can join the network as a producer or just a visitor. You can set up your own private Raiznet server to have centralized vision and control over multiple sensors, or even host a public server like ours.",
      nodes: [
        { title: "Decentralized Nodes", desc: "Each SafraSense can act as a network node, sharing production data securely and anonymously." },
        { title: "Self-Hostable", desc: "Run the Raiznet server in your own home (on a Raspberry Pi or PC) and maintain complete sovereignty." },
        { title: "Collective Intelligence", desc: "Share planting guides, images, and cultivation methods with other independent producers." },
        { title: "Local Resilience", desc: "Strengthen local agriculture and rely less on complex supply chains. Discover what is being planted near you to create a stronger and more independent supply network." }
      ]
    },
    waitlist: {
      title: "Early Access",
      desc: "The initial production run of SafraSense (Aqua) will be strictly limited to ensure quality control. Join the waitlist for priority access.",
      placeholder: "Your best email...",
      button: "Join Waitlist",
      registering: "Registering...",
      successMessage: "Email registered, we will inform you when the product is available."
    },
    faq: {
      title: "Frequently Asked Questions",
      items: [
        { q: "When will SafraSense be available?", a: "We expect to ship the first batch by the end of this semester. We manufacture in small batches focusing entirely on hardware precision." },
        { q: "Does the device need constant internet access?", a: "No. SafraSense can operate 100% offline, logging data internally and syncing only when a trusted network is detected." },
        { q: "Does it work for soil-based planting?", a: "This initial version (Aqua) is specifically designed for hydroponic and aquaponic reservoirs. Soil sensors are on our future roadmap." },
        { q: "How do I access the code and schematics?", a: "Everything will be published in our public repository under a permissive open-source license on the official launch day. The power is yours." }
      ]
    },
    footer: {
      rights: "All rights reserved.",
      contact: "Contact",
      address: "Address",
      social: "Social Media"
    }
  },
  es: {
    nav: { manifesto: "Manifiesto", product: "SafraSense", network: "Raiznet", waitlist: "Espera", faq: "FAQ", contact: "Contacto", store: "Tienda" },
    hero: {
      title: "Soluciones Confiables.",
      subtitle: "Tú defines cómo usarlas.",
      desc: "Productos desarrollados de manera abierta. Obtenga acceso completo a esquemas eléctricos, código fuente y cada pieza de repuesto. Asuma el control absoluto: construimos soluciones enfocadas en la privacidad, seguridad y ética."
    },
    manifesto: {
      title: "Manifiesto por la Autonomía",
      items: [
        { 
          title: "Conocimiento Aberto", 
          desc: "Creemos que quienes confían en sus soluciones las desarrollan de manera abierta. La libre circulación del conocimiento es la vía más rápida y honesta de evolución. No tenemos patentes: le animamos a comprar los componentes y montarlos usted mismo. Comercializamos la idea lista para quienes tienen prisa, además de componentes de repuesto.",
          icon: <Code2 className="w-8 h-8 mb-6" />
        },
        { 
          title: "Libertad para Expandir", 
          desc: "Usted es libre de usar, modificar y expandir nuestras tecnologías como mejor le parezca. Nacemos sobre las bases sólidas da comunidad open-source y esperamos que nuestros sistemas también crezcan en ella. Garantizamos que su infraestructura, hardware y privacidad estén siempre bajo su control absoluto.",
          icon: <Server className="w-8 h-8 mb-6" />
        },
        { 
          title: "Competencia como Defensa", 
          desc: "Al abrir nuestro código y esquemáticos, asumimos conscientemente el riesgo de que la competencia cree copias. Nuestra única defensa es nuestra competencia técnica, honestidad y transparencia. Conquistamos al usuario ofreciendo siempre el mejor equilibrio entre costo-beneficio, confianza y soporte impecable.",
          icon: <HeartHandshake className="w-8 h-8 mb-6" />
        },
        {
          title: "Derecho a Reparar",
          desc: "Nuestras soluciones son modulares, diseñadas para un fácil mantenimiento y funcionamiento duradero. Repudiamos a obsolescência programada: proporcionamos todas las piezas de repuesto y las instrucciones necesarias para que usted mismo pueda reparar, modificar y extender la vida útil de su equipo.",
          icon: <Wrench className="w-8 h-8 mb-6" />
        }
      ]
    },
    safra: {
      tag: "LANZAMIENTO",
      title: "SafraSense",
      desc: "Simplifique, acelere y aumente su cultivo hidropónico casero. Un sensor inteligente, autónomo e inalámbrico diseñado para monitorear su cultivo e informarle de los mejores momentos para reponer los nutrientes o el agua del sistema, además de ayudar con otras tareas de mantenimiento comunes en este tipo de cultivo.",
      features: [
        { title: "Métricas Vitales", desc: "Mide Conductividad Eléctrica (EC), pH, temperatura, humedad y nivel del agua del depósito." },
        { title: "Energía Solar", desc: "Independencia total de la red eléctrica. Panel solar integrado con batería de alta capacidad." },
        { title: "Conectividade Flexible", desc: "Sincroniza datos vía Wi-Fi directamente con su red local o de forma integrada con Raiznet." },
        { title: "Inteligencia Analítica", desc: "Entenda o comportamento de su cultivo. Las lecturas cada 30 minutos se procesan para proporcionar un historial detallado e información precisa sobre la salud de su planta." },
        { title: "Comunidad", desc: "Opcionalmente únase a Raiznet, donde usted define qué comparte. Encuentre pequeños agricultores en su región. Las posibilidades van desde intercambiar cultivos hasta compartir datos de sensores y cosechas para que la comunidad mejore sus producciones en conjunto." }
      ],
      priceLabel: "Precio Estimado",
      price: "20€ - 40€",
      cta: "Lista de Espera"
    },
    raiznet: {
      title: "Red Raiznet",
      desc: "No cultive de forma aislada. Raiznet es un ecosistema descentralizado que actúa como HUB para pequeños productores locales. Cualquier persona puede unirse a la red como productor o simplemente como visitante. Puede configurar su propio servidor privado Raiznet para tener visión y control general de múltiples sensores, o incluso alojar un servidor público como el nuestro.",
      nodes: [
        { title: "Nodos Descentralizados", desc: "Cada SafraSense puede ser un nodo en la red, compartiendo datos de producción de forma segura y anónima." },
        { title: "Autohospedable", desc: "Ejecute el servidor Raiznet en su propia casa (en una Raspberry Pi ou PC) e mantenga la soberanía total." },
        { title: "Inteligencia Colectiva", desc: "Comparta guías de siembra, imágenes y métodos de cultivo con otros productores independientes." },
        { title: "Resiliencia Local", desc: "Fortalezca la agricultura local y dependa menos de las complejas cadenas de suministro. Descubra lo que se está plantando cerca de usted para crear una red de suministro más fuerte e independiente." }
      ]
    },
    waitlist: {
      title: "Acceso Anticipado",
      desc: "La producción inicial de SafraSense (Aqua) será limitada para garantizar la excelencia en el control de qualidade. Únase a la lista de espera para tener prioridad.",
      placeholder: "Su melhor correo...",
      button: "Entrar en la Lista",
      registering: "Registrando...",
      successMessage: "Correo registrado, le informaremos cuando el producto esté disponible."
    },
    faq: {
      title: "Preguntas Frecuentes",
      items: [
        { q: "¿Cuándo estará disponible SafraSense?", a: "La previsión de envío del primer lote é para finales de este semestre. Producimos a pequeña escala centrándonos exclusivamente en la precisión del hardware." },
        { q: "¿El dispositivo necesita internet todo el tempo?", a: "No. SafraSense puede funcionar de forma 100% offline, registrando los datos internamente y sincronizándose solo cuando se detecta una red de confianza." },
        { q: "¿Sirve para plantar en tierra/suelo?", a: "Esta versión inicial (Aqua) fue diseñada específicamente para depósitos de hidroponía y acuaponía. Los sensores de suelo están en nuestra hoja de ruta futura." },
        { q: "¿Cómo accedo al código y los esquemas?", a: "Todo se publicará en nuestro repositorio público bajo una licencia de código abierto permisiva el día del lanzamiento oficial. El poder es suyo." }
      ]
    },
    footer: {
      rights: "Todos los derechos reservados.",
      contact: "Contacto",
      address: "Dirección",
      social: "Redes Sociais"
    }
  },
  zh: {
    nav: { manifesto: "宣言", product: "SafraSense", network: "Raiznet", waitlist: "等候名单", faq: "常见问题", contact: "联系我们", store: "商店" },
    hero: {
      title: "可靠的解决方案。",
      subtitle: "由您定义使用方式。",
      desc: "以开放方式开发的产品。获取完整的电路图、源代码和每一个备件。掌握绝对控制权：我们构建专注于隐私、安全和道德的解决方案。"
    },
    manifesto: {
      title: "自主宣言",
      items: [
        { 
          title: "开放知识", 
          desc: "我们相信，信任其解决方案的人会以开放的方式进行开发。知识的自由流动是进化最快、最诚实的途径。我们没有专利：我们鼓励您购买组件并自行组装。我们为赶时间的人提供现成的方案，同时也提供更换零件。",
          icon: <Code2 className="w-8 h-8 mb-6" />
        },
        { 
          title: "扩展自由", 
          desc: "您可以根据自己的意愿自由使用、修改和扩展我们的技术。我们诞生于开源社区的坚实基础之上，并希望我们的系统也能在其中成长。我们确保您的基础设施、硬件和隐私始终处于您的绝对控制之下。",
          icon: <Server className="w-8 h-8 mb-6" />
        },
        { 
          title: "以能力为防御", 
          desc: "通过公开我们的代码和图纸，我们有意识地承担了竞争对手创建副本的风险。我们唯一的防御是我们的技术能力、诚实和透明度。我们通过始终在性价比、信任和完美支持之间提供最佳平衡来赢得用户。",
          icon: <HeartHandshake className="w-8 h-8 mb-6" />
        },
        {
          title: "维修权利",
          desc: "我们的解决方案是模块化的，旨在易于维护和持久运行。我们拒绝计划性淘汰：我们提供所有更换零件和必要的说明，以便您可以自己修理、修改和延长设备的生命周期。",
          icon: <Wrench className="w-8 h-8 mb-6" />
        }
      ]
    },
    safra: {
      tag: "新发布",
      title: "SafraSense",
      desc: "简化、加速并增加您的家庭水培种植。这是一款智能、自主且无线的传感器，旨在监控您的作物并通知您补充系统养分或水的最佳时机，同时还协助处理此类种植中其他常见的维护任务。",
      features: [
        { title: "关键指标", desc: "测量电导率 (EC)、pH 值、温度、湿度和储水箱水位。" },
        { title: "太阳能供电", desc: "完全独立于电网. 集成太阳能电池板和高容量电池。" },
        { title: "灵活连接", desc: "通过 Wi-Fi 直接与您的本地网络同步，或与 Raiznet 无缝集成。" },
        { title: "分析智能", desc: "了解您作物的行为. 每 30 分钟进行一次读取处理，以提供详细的历史记录和关于植物健康的精确见解。" },
        { title: "社区", desc: "可选加入 Raiznet，您可以定义分享内容。寻找您所在地区的当地小农。可能性从贸易作物到共享传感器和收获数据，以便社区共同提高产量。" }
      ],
      priceLabel: "预计价格",
      price: "¥150 - ¥300",
      cta: "等候名单"
    },
    raiznet: {
      title: "Raiznet 网络",
      desc: "不要孤立种植。Raiznet 是一个去中心化的生态系统，充当当地小型生产者的枢纽。任何人都可以作为生产者或仅仅是访问者加入网络。您可以配置自己的私人 Raiznet 服务器，以便对多个传感器进行全局视觉和控制，甚至可以像我们一样托管公共服务器。",
      nodes: [
        { title: "去中心化节点", desc: "每个 SafraSense 都可以作为网络中的一个节点，安全匿名地共享生产数据。" },
        { title: "可自托管", desc: "在您自己家中（在 Raspberry Pi 或 PC 上）运行 Raiznet 服务器，保持完全主权。" },
        { title: "集体智慧", desc: "与其他独立生产者分享种植指南、图片和种植方法。" },
        { title: "地方韧性", desc: "加强当地农业，减少对复杂供应链的依赖。发现您附近正在种植什么，以创建一个更强大、更独立的供应网络。" }
      ]
    },
    waitlist: {
      title: "抢先体验",
      desc: "SafraSense (Aqua) 的初始生产将受到严格限制，以确保卓越的质量控制。加入等候名单以获得优先权。",
      placeholder: "您最常用的邮箱...",
      button: "加入名单",
      registering: "注册中...",
      successMessage: "邮箱已登记，产品上市时我们将通知您。"
    },
    faq: {
      title: "常见问题",
      items: [
        { q: "SafraSense 何时上市？", a: "预计第一批将在本半年末发货。我们小批量生产，完全专注于硬件精度。" },
        { q: "设备需要一直联网吗？", a: "不。SafraSense 可以 100% 离线运行，在内部记录数据，仅在检测到信任网络时才进行同步。" },
        { q: "适用于土培吗？", a: "初始版本 (Aqua) 专为水培和鱼菜共生储水箱设计。土壤传感器在我们的未来路线图中。" },
        { q: "如何获取代码和图纸？", a: "所有内容将在正式发布当天在我们的公共仓库中根据许可的开源协议发布。力量掌握在您手中。" }
      ]
    },
    footer: {
      rights: "保留所有权利。",
      contact: "联系我们",
      address: "地址",
      social: "社交媒体"
    }
  },
  ja: {
    nav: { manifesto: "マニフェスト", product: "SafraSense", network: "Raiznet", waitlist: "ウェイティングリスト", faq: "FAQ", contact: "お問い合わせ", store: "ストア" },
    hero: {
      title: "信頼できるソリューションを。",
      subtitle: "使い方は、あなたが決める。",
      desc: "オープンに開発された製品。回路図、ソースコード、そしてすべての交換部品にアクセス可能. 絶対的なコントロールをその手に：私たちはプライバシー、セキュリティ、そして倫理に焦点を当てたソリューションを構築します。"
    },
    manifesto: {
      title: "自律のためのマニフェスト",
      items: [
        { 
          title: "オープンな知識", 
          desc: "自らのソリューションを信じる者は、それをオープンに開発すると私たちは信じています。知識 of 自由な循環は、進化への最も速く、最も誠実な道です。特許は持ちません。コンポーネントを購入し、自身で組み立てることを奨励します。急ぐ方には完成したアイデアを、そして交換用コンポーネント भी 提供します。",
          icon: <Code2 className="w-8 h-8 mb-6" />
        },
        { 
          title: "拡張の自由", 
          desc: "私たちのテクノロジーを、あなたが適切と考える方法で自由に使用、修正、拡張することができます。私たちはオープンソースコミュニティの強固な基盤の上に生まれ、私たちのシステムもその中で共に成長していくことを願っています。インフラ、ハードウェア、そしてプライバシーが常にあなたの絶対的な管理下にあることを保証します。",
          icon: <Server className="w-8 h-8 mb-6" />
        },
        { 
          title: "防衛としての実力", 
          desc: "コードと設計図を公開することで、競合他社がコピーを作成するリスクを自覚的に受け入れています。私たちの唯一の防衛策は、技術的な実力、誠実さ、 death と透明性です。コストパフォーマンス、信頼、そして完璧なサポートの間の最良のバランスを常に提供することで、ユーザーの支持を獲得します。",
          icon: <HeartHandshake className="w-8 h-8 mb-6" />
        },
        {
          title: "修理する権利",
          desc: "私たちのソリューションはモジュール式で、メンテナンスが容易で長持ちするように設計されています。計画的陳腐化を否定します。すべての交換部品と必要な指示を提供し、あなた自身で修理、改造、機器の寿命延長ができるようにします。",
          icon: <Wrench className="w-8 h-8 mb-6" />
        }
      ]
    },
    safra: {
      tag: "ニューリリース",
      title: "SafraSense",
      desc: "家庭用水耕栽培システムをより簡単に、より速く、より豊かに。栽培状況を監視し、養分や水の補給の最適なタイミングを通知する、スマートで自律的なワイヤレスセンサー。この種の栽培における一般的なメンテナンスもサポートします。",
      features: [
        { title: "バイタル指標", desc: "電気伝導度（EC）、pH、温度、湿度、および貯水槽の水位を測定します。" },
        { title: "ソーラー電源", desc: "電力網からの完全な独立. 高容量バッテリーを備えた統合ソーラーパネル。" },
        { title: "柔軟な接続性", desc: "Wi-Fi経由でローカルネットワークと直接同期、またはRaiznetとシームレスに統合。" },
        { title: "分析インテリジェンス", desc: "栽培状況の挙動を理解. 30分ごとの測定データを処理し、詳細な履歴と植物の健康状態に関する正確なインサイトを提供します。" },
        { title: "コミュニティ", desc: "任意でRaiznetに参加し、共有する内容を自分で定義できます。地域の小規模生産者を見つけましょう。作物の交換から、コミュニティ全体での収穫量向上のためのセンサーデータや収穫データの共有まで、可能性は広がります。" }
      ],
      priceLabel: "予定価格",
      price: "¥3,000 - ¥6,000",
      cta: "ウェイティングリスト"
    },
    raiznet: {
      title: "Raiznet ネットワーク",
      desc: "孤立して栽培しないでください。Raiznetは、地域の小規模生産者のためのハブとして機能する分散型エコシステムです。生産者として、あるいは訪問者として、誰でもネットワークに参加できます。独自のプライベートRaiznetサーバーを設定して複数のセンサーを集中管理したり、私たちのようにパブリックサーバーをホストしたりすることも可能です。",
      nodes: [
        { title: "分散型ノード", desc: "各SafraSenseがネットワークのノードとなり、生産データを安全かつ匿名で共有できます。" },
        { title: "セルフホスト可能", desc: "自宅のRaspberry PiやPCでRaiznetサーバーを実行し、完全な主権を維持できます。" },
        { title: "集合知", desc: "他の独立した生産者と、栽培ガイド、画像、栽培方法を共有できます。" },
        { title: "地域のレジリエンス", desc: "地域の農業を強化し、複雑なサプライチェーンへの依存を減らします。近隣で何が栽培されているかを知り、より強力で独立した供給ネットワークを構築しましょう。" }
      ]
    },
    waitlist: {
      title: "早期アクセス",
      desc: "SafraSense (Aqua) の初期生産分は、品質管理を徹底するため数量限定となります。優先的に案内を受け取るには、ウェイティングリストにご登録ください。",
      placeholder: "メールアドレスを入力...",
      button: "リストに登録",
      registering: "登録中...",
      successMessage: "メールアドレスが登録されました。商品が利用可能になり次第、お知らせいたします。"
    },
    faq: {
      title: "よくある質問",
      items: [
        { q: "SafraSenseはいつ利用可能になりますか？", a: "第一弾の発送は今期末を予定しています. ハードウェアの精度に完全に焦点を当て、小規模で生産しています。" },
        { q: "デバイスは常にインターネットに接続している必要がありますか？", a: "いいえ. SafraSenseは100%オフラインで動作し、データを内部に記録. 信頼できるネットワークが検出されたときにのみ同期します。" },
        { q: "土耕栽培でも使えますか？", a: "この初期バージョン（Aqua）は、水耕栽培およびアクアポニックスの貯水槽専用に設計されています. 土壌センサーは今後のロードマップに含まれています。" },
        { q: "コードや設計図にはどうすればアクセスできますか？", a: "すべては、正式リリースの日に寛容なオープンソースライセンスの下で公開リポジトリに公開されます. 力はあなたの手にあります。" }
      ]
    },
    footer: {
      rights: "All rights reserved.",
      contact: "お問い合わせ",
      address: "住所",
      social: "ソーシャルメディア"
    }
  }
};
