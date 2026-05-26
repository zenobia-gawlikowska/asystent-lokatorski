import type { DecisionTree } from "./types";

// Seed data for MVP. Document filenames are placeholders — drop actual files
// into /public/documents/<city-id>/ and update the filename fields.
// Translations marked [TODO] need native-speaker review before going live.

export const tree: DecisionTree = [
  {
    id: "warszawa",
    name: "Warszawa",
    caseTypes: [
      {
        id: "wypowiedzenie",
        label: {
          pl: "Wypowiedzenie umowy najmu",
          ua: "Розірвання договору оренди",
          ru: "Расторжение договора аренды",
          en: "Termination of tenancy",
          es: "Rescisión del contrato de arrendamiento",
          fr: "Résiliation du bail",
        },
        description: {
          pl: "Otrzymałem/am pismo wypowiadające umowę najmu lub grożące eksmisją.",
          ua: "Я отримав/ла листа про розірвання договору оренди або загрозу виселення.",
          ru: "Я получил/а письмо о расторжении договора аренды или угрозе выселения.",
          en: "I received a written notice terminating my tenancy or threatening eviction.",
          es: "Recibí una carta de rescisión del contrato de alquiler o con amenaza de desalojo.",
          fr: "J'ai reçu un courrier résiliant mon bail ou menaçant de m'expulser.",
        },
        stages: [
          {
            id: "otrzymalem-wypowiedzenie",
            label: {
              pl: "Właśnie otrzymałem/am wypowiedzenie",
              ua: "Щойно отримав/ла повідомлення про розірвання",
              ru: "Только что получил/а уведомление о расторжении",
              en: "I just received the termination notice",
              es: "Acabo de recibir el aviso de rescisión",
              fr: "Je viens de recevoir l'avis de résiliation",
            },
            documents: [
              {
                id: "sprzeciw-wypowiedzenie",
                name: {
                  pl: "Sprzeciw od wypowiedzenia umowy najmu",
                  ua: "Заперечення на розірвання договору оренди",
                  ru: "Возражение на расторжение договора аренды",
                  en: "Objection to tenancy termination",
                  es: "Oposición a la rescisión del contrato",
                  fr: "Opposition à la résiliation du bail",
                },
                filename: "/documents/warszawa/sprzeciw-wypowiedzenie.pdf",
                note: {
                  pl: "Złóż sprzeciw w ciągu 30 dni od otrzymania wypowiedzenia.",
                  ua: "Подайте заперечення протягом 30 днів з дня отримання повідомлення.",
                  ru: "Подайте возражение в течение 30 дней с момента получения уведомления.",
                  en: "File the objection within 30 days of receiving the notice.",
                  es: "Presente la oposición en un plazo de 30 días desde la recepción del aviso.",
                  fr: "Déposez votre opposition dans les 30 jours suivant la réception de l'avis.",
                },
              },
            ],
          },
          {
            id: "termin-minal",
            label: {
              pl: "Termin wypowiedzenia minął, nadal mieszkam",
              ua: "Термін закінчився, я досі проживаю",
              ru: "Срок истёк, я продолжаю проживать",
              en: "Notice period expired, I'm still living there",
              es: "Venció el plazo y sigo viviendo allí",
              fr: "Le délai est expiré, j'y habite toujours",
            },
            subTypes: [
              {
                id: "dzika-eksmisja-sub",
                label: {
                  pl: "Dzika eksmisja (właściciel stosuje nielegalne metody)",
                  ua: "Незаконне виселення (власник застосовує незаконні методи)",
                  ru: "Незаконное выселение (владелец применяет незаконные методы)",
                  en: "Illegal eviction (landlord using unlawful methods)",
                  es: "Desalojo ilegal (el arrendador usa métodos ilegales)",
                  fr: "Expulsion illégale (le propriétaire recourt à des méthodes illicites)",
                },
                description: {
                  pl: "Właściciel nie czeka na sąd — odcina media, nachodzi mieszkanie lub grozi, żebym się wyprowadziła.",
                  ua: "Власник не чекає суду — відключає комунальні послуги, вривається до квартири або погрожує виселенням.",
                  ru: "Владелец не ждёт суда — отключает коммунальные услуги, вторгается в жильё или угрожает выселением.",
                  en: "The landlord isn't waiting for court — cutting utilities, entering the flat, or threatening eviction.",
                  es: "El arrendador no espera al juzgado: corta suministros, irrumpe en el piso o amenaza con el desalojo.",
                  fr: "Le propriétaire n'attend pas le tribunal : il coupe les services, pénètre dans le logement ou menace d'expulsion.",
                },
                stages: [
                  {
                    id: "bezprawne-odciecie-mediow-sub",
                    label: {
                      pl: "Właściciel odciął media (prąd, wodę, ogrzewanie)",
                      ua: "Власник відключив комунальні послуги (електрику, воду, опалення)",
                      ru: "Владелец отключил коммунальные услуги (электричество, воду, отопление)",
                      en: "Landlord cut off utilities (electricity, water, heating)",
                      es: "El arrendador cortó los suministros (electricidad, agua, calefacción)",
                      fr: "Le propriétaire a coupé les services (électricité, eau, chauffage)",
                    },
                    documents: [
                      {
                        id: "wezwanie-przywrocenie-mediow-sub",
                        name: {
                          pl: "Wezwanie do przywrócenia mediów / dostępu do lokalu",
                          ua: "Вимога про відновлення комунальних послуг / доступу до житла",
                          ru: "Требование о восстановлении коммунальных услуг / доступа к жилью",
                          en: "Demand to restore utilities / access to the flat",
                          es: "Requerimiento de restablecimiento de suministros / acceso al piso",
                          fr: "Mise en demeure de rétablir les services / l'accès au logement",
                        },
                        filename: "/documents/warszawa/wezwanie-przywrocenie-mediow.pdf",
                        note: {
                          pl: "Jednocześnie zgłoś sprawę na Policję i do Prokuratury — odcięcie mediów może być przestępstwem (art. 191 §1a kk).",
                          ua: "Одночасно зверніться до Поліції та Прокуратури — відключення комунальних послуг може бути злочином (ст. 191 §1a КК).",
                          ru: "Одновременно обратитесь в Полицию и Прокуратуру — отключение коммунальных услуг может являться преступлением (ст. 191 §1a УК).",
                          en: "At the same time report to the Police and Prosecutor's Office — cutting utilities may be a criminal offence (Art. 191 §1a of the Penal Code).",
                          es: "Al mismo tiempo, informe a la Policía y a la Fiscalía — el corte de suministros puede ser un delito (art. 191 §1a del Código Penal).",
                          fr: "Signalez également à la Police et au Parquet — la coupure des services peut constituer une infraction pénale (art. 191 §1a du Code pénal).",
                        },
                      },
                      {
                        id: "nekanie-odciecie-mediow-sub",
                        name: {
                          pl: "Zawiadomienie o nękaniu przez odcięcie mediów",
                          ua: "Повідомлення про переслідування шляхом відключення комунальних послуг",
                          ru: "Уведомление о притеснении путём отключения коммунальных услуг",
                          en: "Notice of harassment by utility cutoff",
                          es: "Notificación de acoso mediante corte de suministros",
                          fr: "Signalement de harcèlement par coupure des services",
                        },
                        filename: "/documents/warszawa/nekanie-odciecie-mediow.pdf",
                        note: {
                          pl: "Odcięcie mediów może być przestępstwem nękania (art. 190a kk). Zgłoś sprawę równolegle na Policję.",
                          ua: "Відключення комунальних послуг може бути злочином переслідування (ст. 190a КК). Повідомте Поліцію одночасно.",
                          ru: "Отключение коммунальных услуг может являться преступлением преследования (ст. 190a УК). Сообщите в Полицию одновременно.",
                          en: "Cutting utilities may constitute criminal harassment (Art. 190a Penal Code). Report to the Police at the same time.",
                          es: "El corte de suministros puede constituir acoso criminal (art. 190a del Código Penal). Denuncie a la Policía al mismo tiempo.",
                          fr: "La coupure des services peut constituer un harcèlement criminel (art. 190a du Code pénal). Signalez-le simultanément à la Police.",
                        },
                      },
                    ],
                  },
                  {
                    id: "najscie-w-lokalu-sub",
                    label: {
                      pl: "Właściciel wchodzi do mieszkania bez mojej zgody",
                      ua: "Власник входить до квартири без мого дозволу",
                      ru: "Владелец входит в жильё без моего согласия",
                      en: "Landlord enters my home without my consent",
                      es: "El arrendador entra al piso sin mi consentimiento",
                      fr: "Le propriétaire entre dans mon logement sans mon accord",
                    },
                    documents: [
                      {
                        id: "naruszenie-posiadania-sub",
                        name: {
                          pl: "Wniosek o ochronę naruszonego posiadania",
                          ua: "Заява про захист порушеного права власності",
                          ru: "Заявление о защите нарушенного права владения",
                          en: "Application for protection of violated possession",
                          es: "Solicitud de protección de la posesión vulnerada",
                          fr: "Requête en protection de la possession violée",
                        },
                        filename: "/documents/warszawa/naruszenie-posiadania.pdf",
                        note: {
                          pl: "Złóż wniosek do sądu rejonowego w ciągu roku od naruszenia posiadania.",
                          ua: "Подайте заяву до районного суду протягом одного року від порушення права власності.",
                          ru: "Подайте заявление в районный суд в течение одного года с момента нарушения права владения.",
                          en: "File the application with the district court within one year of the violation.",
                          es: "Presente la solicitud ante el juzgado de primera instancia en el plazo de un año desde la vulneración.",
                          fr: "Déposez la requête au tribunal d'arrondissement dans l'année suivant la violation.",
                        },
                      },
                    ],
                  },
                  {
                    id: "postepowanie-umorzone-sub",
                    label: {
                      pl: "Policja umorzyła postępowanie, chcę się odwołać",
                      ua: "Поліція закрила справу, хочу оскаржити рішення",
                      ru: "Полиция прекратила дело, хочу обжаловать решение",
                      en: "Police closed the case, I want to appeal",
                      es: "La policía archivó el caso, quiero recurrir",
                      fr: "La police a classé l'affaire, je veux faire appel",
                    },
                    documents: [
                      {
                        id: "zazalenie-umorzenie-sub",
                        name: {
                          pl: "Zażalenie na postanowienie o umorzeniu postępowania",
                          ua: "Скарга на постанову про закриття провадження",
                          ru: "Жалоба на постановление о прекращении производства",
                          en: "Appeal against the decision to discontinue proceedings",
                          es: "Recurso contra la resolución de archivo de actuaciones",
                          fr: "Recours contre la décision de classement sans suite",
                        },
                        filename: "/documents/warszawa/zazalenie-umorzenie.pdf",
                      },
                    ],
                  },
                ],
              },
              {
                id: "pozew-o-eksmisje",
                label: {
                  pl: "Pozew o eksmisję (sprawa sądowa)",
                  ua: "Позов про виселення (судова справа)",
                  ru: "Иск о выселении (судебное дело)",
                  en: "Eviction lawsuit (court proceedings)",
                  es: "Demanda de desahucio (procedimiento judicial)",
                  fr: "Demande d'expulsion (procédure judiciaire)",
                },
                description: {
                  pl: "Właściciel złożył do sądu pozew o eksmisję i czekam na rozprawę lub wyrok.",
                  ua: "Власник подав до суду позов про виселення, я чекаю на слухання або рішення.",
                  ru: "Владелец подал иск о выселении в суд, я жду слушания или решения.",
                  en: "The landlord has filed an eviction lawsuit and I am waiting for the hearing or judgment.",
                  es: "El arrendador ha presentado una demanda de desahucio y espero la vista o la sentencia.",
                  fr: "Le propriétaire a déposé une demande d'expulsion et j'attends l'audience ou le jugement.",
                },
                stages: [
                  {
                    id: "otrzymalem-pozew-eksmisja",
                    label: {
                      pl: "Otrzymałem/am pozew lub nakaz eksmisji",
                      ua: "Отримав/ла позов або наказ про виселення",
                      ru: "Получил/а иск или приказ о выселении",
                      en: "I received the eviction lawsuit or order",
                      es: "Recibí la demanda o la orden de desahucio",
                      fr: "J'ai reçu la demande d'expulsion ou l'ordonnance",
                    },
                    documents: [
                      {
                        id: "odpowiedz-pozew-eksmisja",
                        name: {
                          pl: "Odpowiedź na pozew o eksmisję",
                          ua: "Відповідь на позов про виселення",
                          ru: "Ответ на иск о выселении",
                          en: "Response to eviction lawsuit",
                          es: "Contestación a la demanda de desahucio",
                          fr: "Réponse à la demande d'expulsion",
                        },
                        filename: "/documents/warszawa/odpowiedz-pozew-eksmisja.pdf",
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "podwyzka-czynszu",
        label: {
          pl: "Podwyżka czynszu",
          ua: "Підвищення орендної плати",
          ru: "Повышение арендной платы",
          en: "Rent increase",
          es: "Aumento del alquiler",
          fr: "Augmentation du loyer",
        },
        description: {
          pl: "Właściciel informuje mnie o podwyżce czynszu lub żąda wyższych opłat.",
          ua: "Власник повідомляє мені про підвищення орендної плати або вимагає більших платежів.",
          ru: "Владелец уведомляет меня о повышении арендной платы или требует более высоких платежей.",
          en: "My landlord is informing me of a rent increase or demanding higher payments.",
          es: "Mi arrendador me informa de un aumento del alquiler o exige pagos más altos.",
          fr: "Mon propriétaire m'informe d'une augmentation du loyer ou exige des paiements plus élevés.",
        },
        stages: [
          {
            id: "zawiadomienie-o-podwyzce",
            label: {
              pl: "Dostałem/am pisemne zawiadomienie o podwyżce",
              ua: "Отримав/ла письмове повідомлення про підвищення",
              ru: "Получил/а письменное уведомление о повышении",
              en: "I received a written rent increase notice",
              es: "Recibí una notificación escrita de aumento del alquiler",
              fr: "J'ai reçu un avis écrit d'augmentation du loyer",
            },
            documents: [
              {
                id: "sprzeciw-podwyzka",
                name: {
                  pl: "Sprzeciw od podwyżki czynszu",
                  ua: "Заперечення на підвищення орендної плати",
                  ru: "Возражение на повышение арендной платы",
                  en: "Objection to rent increase",
                  es: "Oposición al aumento del alquiler",
                  fr: "Opposition à l'augmentation du loyer",
                },
                filename: "/documents/warszawa/pozew-ustalenie-niezasadnosci-podwyzki.pdf",
                note: {
                  pl: "Masz 2 miesiące na złożenie sprzeciwu licząc od dnia doręczenia wypowiedzenia.",
                  ua: "У вас є 2 місяці для подачі заперечення з дня вручення повідомлення.",
                  ru: "У вас есть 2 месяца для подачи возражения с момента вручения уведомления.",
                  en: "You have 2 months to file an objection from the date the notice was served.",
                  es: "Tiene 2 meses para presentar la oposición desde la fecha de notificación.",
                  fr: "Vous avez 2 mois pour déposer votre opposition à compter de la date de notification.",
                },
              },
            ],
          },
          {
            id: "podwyzka-bez-pisma",
            label: {
              pl: "Właściciel żąda podwyżki bez pisemnego uzasadnienia",
              ua: "Власник вимагає підвищення без письмового обґрунтування",
              ru: "Владелец требует повышения без письменного обоснования",
              en: "Landlord demands increase without written justification",
              es: "El arrendador exige aumento sin justificación escrita",
              fr: "Le propriétaire exige une augmentation sans justification écrite",
            },
            documents: [
              {
                id: "wezwanie-uzasadnienie",
                name: {
                  pl: "Wezwanie do dostarczenia pisemnego uzasadnienia podwyżki",
                  ua: "Вимога про надання письмового обґрунтування підвищення",
                  ru: "Требование о предоставлении письменного обоснования повышения",
                  en: "Demand for written justification of rent increase",
                  es: "Solicitud de justificación escrita del aumento",
                  fr: "Demande de justification écrite de l'augmentation",
                },
                filename: "/documents/warszawa/wezwanie-uzasadnienie-podwyzki.pdf",
              },
            ],
          },
        ],
      },
      {
        id: "zaniedbanie-napraw",
        label: {
          pl: "Zaniedbanie napraw przez właściciela",
          ua: "Нехтування ремонтом з боку власника",
          ru: "Халатность владельца в вопросах ремонта",
          en: "Landlord neglecting repairs",
          es: "Negligencia del arrendador en reparaciones",
          fr: "Négligence du propriétaire en matière de réparations",
        },
        description: {
          pl: "Mieszkanie wymaga naprawy lub remontu, a właściciel nie reaguje na zgłoszenia.",
          ua: "Квартира потребує ремонту, а власник не реагує на звернення.",
          ru: "Жильё требует ремонта, а владелец не реагирует на обращения.",
          en: "The flat needs repairs and the landlord is not responding to requests.",
          es: "El piso necesita reparaciones y el arrendador no responde a las solicitudes.",
          fr: "Le logement nécessite des réparations et le propriétaire ne répond pas aux demandes.",
        },
        stages: [
          {
            id: "zgloszono-brak-reakcji",
            label: {
              pl: "Zgłosiłem/am usterki, właściciel nie reaguje",
              ua: "Повідомив/ла про несправності, власник не реагує",
              ru: "Сообщил/а о неисправностях, владелец не реагирует",
              en: "I reported defects, landlord is not responding",
              es: "Informé de los defectos, el arrendador no responde",
              fr: "J'ai signalé les défauts, le propriétaire ne répond pas",
            },
            documents: [
              {
                id: "wezwanie-do-naprawy",
                name: {
                  pl: "Wezwanie do wykonania napraw",
                  ua: "Вимога про виконання ремонтних робіт",
                  ru: "Требование о проведении ремонтных работ",
                  en: "Demand to carry out repairs",
                  es: "Requerimiento de ejecución de reparaciones",
                  fr: "Mise en demeure d'effectuer des réparations",
                },
                filename: "/documents/warszawa/wezwanie-do-naprawy.pdf",
              },
            ],
          },
          {
            id: "obnizka-czynszu",
            label: {
              pl: "Chcę obniżyć czynsz z powodu złego stanu lokalu",
              ua: "Хочу знизити орендну плату через поганий стан житла",
              ru: "Хочу снизить арендную плату из-за плохого состояния жилья",
              en: "I want to reduce rent due to poor condition of the flat",
              es: "Quiero reducir el alquiler por el mal estado del piso",
              fr: "Je veux réduire le loyer en raison du mauvais état du logement",
            },
            documents: [
              {
                id: "oswiadczenie-obnizka",
                name: {
                  pl: "Oświadczenie o obniżeniu czynszu",
                  ua: "Заява про зниження орендної плати",
                  ru: "Заявление о снижении арендной платы",
                  en: "Statement of rent reduction",
                  es: "Declaración de reducción del alquiler",
                  fr: "Déclaration de réduction du loyer",
                },
                filename: "/documents/warszawa/oswiadczenie-obnizenie-czynszu.pdf",
              },
            ],
          },
        ],
      },
      {
        id: "dzika-eksmisja",
        label: {
          pl: "Dzika eksmisja (bezprawne działania właściciela)",
          ua: "Незаконне виселення (протиправні дії власника)",
          ru: "Незаконное выселение (противоправные действия владельца)",
          en: "Illegal eviction (unlawful landlord actions)",
          es: "Desalojo ilegal (acciones ilegales del arrendador)",
          fr: "Expulsion illégale (actions illicites du propriétaire)",
        },
        description: {
          pl: "Właściciel stosuje bezprawne metody nacisku — odcina media, nachodzi mnie w lokalu lub grozi, żebym się wyprowadził/a.",
          ua: "Власник застосовує незаконні методи тиску — відключає комунальні послуги, вривається до квартири або погрожує, щоб я виїхав/ла.",
          ru: "Владелец применяет незаконные методы давления — отключает коммунальные услуги, вторгается в жильё или угрожает, чтобы я съехал/а.",
          en: "The landlord is using unlawful pressure tactics — cutting utilities, entering my home without permission, or threatening me to leave.",
          es: "El arrendador utiliza métodos de presión ilegales: corta los suministros, irrumpe en el piso o me amenaza para que me vaya.",
          fr: "Le propriétaire recourt à des méthodes de pression illégales : couper les services, pénétrer dans le logement sans permission ou me menacer pour que je parte.",
        },
        stages: [
          {
            id: "bezprawne-odciecie-mediow",
            label: {
              pl: "Właściciel odciął media (prąd, wodę, ogrzewanie)",
              ua: "Власник відключив комунальні послуги (електрику, воду, опалення)",
              ru: "Владелец отключил коммунальные услуги (электричество, воду, отопление)",
              en: "Landlord cut off utilities (electricity, water, heating)",
              es: "El arrendador cortó los suministros (electricidad, agua, calefacción)",
              fr: "Le propriétaire a coupé les services (électricité, eau, chauffage)",
            },
            documents: [
              {
                id: "wezwanie-przywrocenie-mediow",
                name: {
                  pl: "Wezwanie do przywrócenia mediów / dostępu do lokalu",
                  ua: "Вимога про відновлення комунальних послуг / доступу до житла",
                  ru: "Требование о восстановлении коммунальных услуг / доступа к жилью",
                  en: "Demand to restore utilities / access to the flat",
                  es: "Requerimiento de restablecimiento de suministros / acceso al piso",
                  fr: "Mise en demeure de rétablir les services / l'accès au logement",
                },
                filename: "/documents/warszawa/wezwanie-przywrocenie-mediow.pdf",
                note: {
                  pl: "Jednocześnie zgłoś sprawę na Policję i do Prokuratury — odcięcie mediów może być przestępstwem (art. 191 §1a kk).",
                  ua: "Одночасно зверніться до Поліції та Прокуратури — відключення комунальних послуг може бути злочином (ст. 191 §1a КК).",
                  ru: "Одновременно обратитесь в Полицию и Прокуратуру — отключение коммунальных услуг может являться преступлением (ст. 191 §1a УК).",
                  en: "At the same time report to the Police and Prosecutor's Office — cutting utilities may be a criminal offence (Art. 191 §1a of the Penal Code).",
                  es: "Al mismo tiempo, informe a la Policía y a la Fiscalía — el corte de suministros puede ser un delito (art. 191 §1a del Código Penal).",
                  fr: "Signalez également à la Police et au Parquet — la coupure des services peut constituer une infraction pénale (art. 191 §1a du Code pénal).",
                },
              },
              {
                id: "nekanie-odciecie-mediow",
                name: {
                  pl: "Zawiadomienie o nękaniu przez odcięcie mediów",
                  ua: "Повідомлення про переслідування шляхом відключення комунальних послуг",
                  ru: "Уведомление о притеснении путём отключения коммунальных услуг",
                  en: "Notice of harassment by utility cutoff",
                  es: "Notificación de acoso mediante corte de suministros",
                  fr: "Signalement de harcèlement par coupure des services",
                },
                filename: "/documents/warszawa/nekanie-odciecie-mediow.pdf",
                note: {
                  pl: "Odcięcie mediów może być przestępstwem nękania (art. 190a kk). Zgłoś sprawę równolegle na Policję.",
                  ua: "Відключення комунальних послуг може бути злочином переслідування (ст. 190a КК). Повідомте Поліцію одночасно.",
                  ru: "Отключение коммунальных услуг может являться преступлением преследования (ст. 190a УК). Сообщите в Полицию одновременно.",
                  en: "Cutting utilities may constitute criminal harassment (Art. 190a Penal Code). Report to the Police at the same time.",
                  es: "El corte de suministros puede constituir acoso criminal (art. 190a del Código Penal). Denuncie a la Policía al mismo tiempo.",
                  fr: "La coupure des services peut constituer un harcèlement criminel (art. 190a du Code pénal). Signalez-le simultanément à la Police.",
                },
              },
            ],
          },
          {
            id: "najscie-w-lokalu",
            label: {
              pl: "Właściciel wchodzi do mieszkania bez mojej zgody",
              ua: "Власник входить до квартири без мого дозволу",
              ru: "Владелец входит в жильё без моего согласия",
              en: "Landlord enters my home without my consent",
              es: "El arrendador entra al piso sin mi consentimiento",
              fr: "Le propriétaire entre dans mon logement sans mon accord",
            },
            documents: [
              {
                id: "naruszenie-posiadania",
                name: {
                  pl: "Wniosek o ochronę naruszonego posiadania",
                  ua: "Заява про захист порушеного права власності",
                  ru: "Заявление о защите нарушенного права владения",
                  en: "Application for protection of violated possession",
                  es: "Solicitud de protección de la posesión vulnerada",
                  fr: "Requête en protection de la possession violée",
                },
                filename: "/documents/warszawa/naruszenie-posiadania.pdf",
                note: {
                  pl: "Złóż wniosek do sądu rejonowego w ciągu roku od naruszenia posiadania.",
                  ua: "Подайте заяву до районного суду протягом одного року від порушення права власності.",
                  ru: "Подайте заявление в районный суд в течение одного года с момента нарушения права владения.",
                  en: "File the application with the district court within one year of the violation.",
                  es: "Presente la solicitud ante el juzgado de primera instancia en el plazo de un año desde la vulneración.",
                  fr: "Déposez la requête au tribunal d'arrondissement dans l'année suivant la violation.",
                },
              },
            ],
          },
          {
            id: "postepowanie-umorzone",
            label: {
              pl: "Policja umorzyła postępowanie, chcę się odwołać",
              ua: "Поліція закрила справу, хочу оскаржити рішення",
              ru: "Полиция прекратила дело, хочу обжаловать решение",
              en: "Police closed the case, I want to appeal",
              es: "La policía archivó el caso, quiero recurrir",
              fr: "La police a classé l'affaire, je veux faire appel",
            },
            documents: [
              {
                id: "zazalenie-umorzenie",
                name: {
                  pl: "Zażalenie na postanowienie o umorzeniu postępowania",
                  ua: "Скарга на постанову про закриття провадження",
                  ru: "Жалоба на постановление о прекращении производства",
                  en: "Appeal against the decision to discontinue proceedings",
                  es: "Recurso contra la resolución de archivo de actuaciones",
                  fr: "Recours contre la décision de classement sans suite",
                },
                filename: "/documents/warszawa/zazalenie-umorzenie.pdf",
              },
            ],
          },
        ],
      },
      {
        id: "odmowa-lokalu",
        label: {
          pl: "Odmowa przyznania lokalu przez Miasto",
          ua: "Відмова міста у наданні житла",
          ru: "Отказ города в предоставлении жилья",
          en: "City's refusal to grant a flat",
          es: "Denegación municipal de asignación de vivienda",
          fr: "Refus de la Ville d'attribuer un logement",
        },
        description: {
          pl: "Miasto odmówiło mi przyznania lub przywrócenia lokalu komunalnego — m.in. po śmierci poprzedniego najemcy lub w związku z uchwałą mieszkaniową.",
          ua: "Місто відмовило мені у наданні або поновленні комунального житла — зокрема після смерті попереднього орендаря або у зв'язку з житловою ухвалою.",
          ru: "Город отказал мне в предоставлении или восстановлении муниципального жилья — в том числе после смерти предыдущего нанимателя или в связи с жилищным постановлением.",
          en: "The City refused to grant or restore a municipal flat — including after the death of the previous tenant or in connection with a housing resolution.",
          es: "El Ayuntamiento me denegó la concesión o restitución de un piso municipal, incluido el caso de fallecimiento del arrendatario anterior o en relación con una resolución de vivienda.",
          fr: "La Ville m'a refusé l'attribution ou la restitution d'un logement municipal — notamment après le décès du locataire précédent ou en lien avec une délibération sur le logement.",
        },
        stages: [
          {
            id: "skarga-uchwaly",
            label: {
              pl: "Chcę zaskarżyć uchwałę mieszkaniową Miasta",
              ua: "Хочу оскаржити житлову ухвалу міста",
              ru: "Хочу обжаловать жилищное постановление города",
              en: "I want to challenge the City's housing resolution",
              es: "Quiero impugnar la resolución de vivienda del Ayuntamiento",
              fr: "Je veux contester la délibération de la Ville sur le logement",
            },
            documents: [
              {
                id: "skarga-uchwaly-doc",
                name: {
                  pl: "Skarga na uchwałę Rady Miasta",
                  ua: "Скарга на рішення міської ради",
                  ru: "Жалоба на решение городского совета",
                  en: "Complaint against City Council resolution",
                  es: "Recurso contra la resolución del Pleno Municipal",
                  fr: "Recours contre la délibération du Conseil municipal",
                },
                filename: "/documents/warszawa/skarga-uchwaly.pdf",
              },
            ],
          },
          {
            id: "prawo-do-lokalu-po-rodzicach",
            label: {
              pl: "Odmówiono mi prawa do lokalu po zmarłych rodzicach",
              ua: "Мені відмовили у праві на житло після смерті батьків",
              ru: "Мне отказали в праве на жильё после смерти родителей",
              en: "I was denied the right to the flat after my parents died",
              es: "Me denegaron el derecho al piso tras el fallecimiento de mis padres",
              fr: "On m'a refusé le droit au logement après le décès de mes parents",
            },
            documents: [
              {
                id: "pozew-art691",
                name: {
                  pl: "Pozew o ustalenie prawa do lokalu (art. 691 KC)",
                  ua: "Позов про встановлення права на житло (ст. 691 ЦК)",
                  ru: "Иск об установлении права на жильё (ст. 691 ГК)",
                  en: "Claim to establish right to flat (Art. 691 Civil Code)",
                  es: "Demanda de reconocimiento del derecho al piso (art. 691 CC)",
                  fr: "Action en reconnaissance du droit au logement (art. 691 CC)",
                },
                filename: "/documents/warszawa/pozew-prawo-do-lokalu-art691.pdf",
                note: {
                  pl: "Art. 691 KC daje prawo do wstąpienia w stosunek najmu po śmierci najemcy osobom bliskim stale z nim zamieszkałym.",
                  ua: "Ст. 691 ЦК надає право на вступ у відносини найму після смерті орендаря близьким особам, які постійно з ним проживали.",
                  ru: "Ст. 691 ГК предоставляет право на вступление в отношения найма после смерти нанимателя близким лицам, постоянно с ним проживавшим.",
                  en: "Art. 691 Civil Code grants the right to assume the tenancy after the tenant's death to close family members who lived with them permanently.",
                  es: "El art. 691 CC otorga el derecho a subrogarse en el contrato de arrendamiento tras la muerte del arrendatario a los familiares cercanos que convivían con él de forma permanente.",
                  fr: "L'art. 691 CC accorde le droit de se substituer au contrat de bail après le décès du locataire aux proches qui cohabitaient avec lui de manière permanente.",
                },
              },
            ],
          },
        ],
      },
    ],
  },
];
