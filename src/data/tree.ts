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
            documents: [
              {
                id: "pismo-bezumowne",
                name: {
                  pl: "Odpowiedź na wezwanie do opuszczenia lokalu",
                  ua: "Відповідь на вимогу звільнити приміщення",
                  ru: "Ответ на требование освободить помещение",
                  en: "Response to demand to vacate",
                  es: "Respuesta a la demanda de desalojo",
                  fr: "Réponse à la demande d'expulsion",
                },
                filename: "/documents/warszawa/odpowiedz-wezwanie-do-opuszczenia.pdf",
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
        id: "odciecie-mediow",
        label: {
          pl: "Odcięcie mediów lub utrudnianie dostępu",
          ua: "Відключення комунальних послуг або перешкоди доступу",
          ru: "Отключение коммунальных услуг или ограничение доступа",
          en: "Utility cutoff or obstructed access",
          es: "Corte de suministros o restricción de acceso",
          fr: "Coupure des services ou obstruction d'accès",
        },
        description: {
          pl: "Właściciel odciął wodę, prąd, ogrzewanie lub uniemożliwia mi wejście do mieszkania.",
          ua: "Власник відключив воду, електрику, опалення або перешкоджає моєму входу до квартири.",
          ru: "Владелец отключил воду, электричество, отопление или препятствует моему входу в жильё.",
          en: "The landlord cut off water, electricity, heating, or is preventing me from entering the flat.",
          es: "El arrendador cortó el agua, la electricidad, la calefacción o me impide entrar al piso.",
          fr: "Le propriétaire a coupé l'eau, l'électricité, le chauffage ou m'empêche d'accéder au logement.",
        },
        stages: [
          {
            id: "media-odciete",
            label: {
              pl: "Media zostały odcięte lub dostęp zablokowany",
              ua: "Комунальні послуги відключено або доступ заблоковано",
              ru: "Коммунальные услуги отключены или доступ заблокирован",
              en: "Utilities cut off or access blocked",
              es: "Suministros cortados o acceso bloqueado",
              fr: "Services coupés ou accès bloqué",
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
            ],
          },
        ],
      },
    ],
  },
];
