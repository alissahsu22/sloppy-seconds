/**
 * Public animals-page copy and photography from
 * https://www.sloppysecondsinc.org/animals
 * Kept as published. This prototype does not rewrite the sanctuary's stories.
 */
import { site } from "./site";

export interface CrewAnimal {
  id: string;
  name: string;
  /** Describes the photograph, species included, since the bios don't always say. */
  alt: string;
  image: string;
  /** Width of the largest file the CDN holds. It resizes down on request but never up. */
  imageWidth: number;
  paragraphs: readonly string[];
  /** Cards with a game get a button that opens it in a window. */
  game?: CrewGame;
  /** Pulls the square crop off bright edges in the photograph. */
  imagePosition?: string;
}

export interface CrewGame {
  kicker: string;
  title: string;
}

/** Squarespace sizes the CDN resizes to. The set stops at the original, so nothing is upscaled. */
const CDN_WIDTHS = [500, 750, 1000, 1500] as const;

export function cdnSrcSet(url: string, sourceWidth: number): string {
  const base = url.split("?")[0];
  const smaller = CDN_WIDTHS.filter((width) => width < sourceWidth).map((width) => `${base}?format=${width}w ${width}w`);
  return [...smaller, `${base}?format=2500w ${sourceWidth}w`].join(", ");
}

export const crewHeroImage = "https://images.squarespace-cdn.com/content/v1/5a4fec360100276da3e4dfa1/1515194718701-1YQ7OX7QVESGTG49VEQV/20729313_1415615008493780_4799500942525652990_n.jpg?format=1800w";

export const crewHeroCaption = "Meet the crew";

export const crewHeading = "Meet the rescued animals at our sanctuary";

export const crew: readonly CrewAnimal[] = [
  {
    id: "brewster",
    name: "Brewster",
    alt: "Brewster, a black pot-bellied pig, resting his wrinkled snout against a wall while a hand scratches his cheek",
    image: "https://images.squarespace-cdn.com/content/v1/5a4fec360100276da3e4dfa1/1523676548892-XJ3L31L9NUIVH96W3O34/brewster.JPG?format=900w",
    imageWidth: 893,
    imagePosition: "72% 64%",
    paragraphs: [
      "Brewster is one of the true OGs at Sloppy Seconds—among the very first animals to join our family. We learned about him just three days before he was scheduled to be euthanized, and without hesitation, we stepped in to give him the second chance he deserved. Born in June 2010, Brewster has been with us ever since, growing into one of the most beloved members of our sanctuary.",
      "He’s the sweetest pig you’ll ever meet—gentle, goofy, and a bit of a lovable oaf. Brewster lives for life’s simple joys: eating, napping in the sun, belly rubs, and greeting visitors with his happy grunts. He has an especially tender connection with children, always patient and kind, and somehow knowing just how to put them at ease.",
    ],
  },
  {
    id: "frida",
    name: "Frida",
    alt: "Frida, a black and white pig, pushing her snout up to the camera in a straw-covered yard",
    image: "https://images.squarespace-cdn.com/content/v1/5a4fec360100276da3e4dfa1/1578851059730-XF9JENJP0GOWTOWBFRB0/frida.jpg?format=900w",
    imageWidth: 400,
    paragraphs: [
      "Frida was surrendered to the San Gabriel Humane Society in Southern California after spending more than 12 years with the same family. By the time she arrived, she was severely depressed and beginning to show aggression toward the staff—her options were running out, and her mental health was a real concern. In November 2019, Frida came to live at Sloppy Seconds, where she faced a brand-new world. She had never met another pig in her life!",
      "After a month of adjusting and recovering from her spay surgery, Frida slowly found her place among our herd. Now, after more than six years with us, she has become the matriarch of the group. Though she still prefers to spend much of her time on her own, the other pigs give her the respect she deserves. At 252 pounds, she’s a big ‘ol love who topples right over for belly brushes and soaks up every bit of affection she can get.",
    ],
  },
  {
    id: "bella",
    name: "Bella",
    alt: "Bella, a black pig with a white stripe down her face, standing in the dirt wearing her grin",
    image: "https://images.squarespace-cdn.com/content/v1/5a4fec360100276da3e4dfa1/1523676594093-VWGNVS8BRMDYH9B54MZY/Bella.jpg?format=900w",
    imageWidth: 1227,
    imagePosition: "50% 70%",
    paragraphs: [
      "Bella came from a loving home, but when her family could no longer keep her, there were no other homes or rescues able to take her in. As a sanctuary, we provide permanent refuge for animals with nowhere else to go, so in June 2013, Bella joined us for life.",
      "She has a special place in the herd—other pigs are often drawn to her side, and Toodles in particular has chosen her as his motherly figure, constantly pestering her for attention. Bella takes it all in stride with patience and grace. A dainty eater (at least for a pig!), she will still scarf down her favorites—cereal, melon, and berries—without hesitation. Gentle and kind with both kids and adults, Bella soaks up attention and is especially vocal when you scratch her just right. And of course, her signature “perma-grin” makes her one of the most endearing faces at the sanctuary.",
    ],
  },
  {
    id: "wilbur",
    name: "Wilbur",
    alt: "Wilbur, a big black pig, lying on a sunny patio with his snout toward the camera",
    game: { kicker: site.kicker, title: site.title },
    image: "https://images.squarespace-cdn.com/content/v1/5a4fec360100276da3e4dfa1/1523676662624-C1IPK70UF0KDTMPYC5O7/wilbur.JPG?format=900w",
    imageWidth: 960,
    imagePosition: "74% 48%",
    paragraphs: [
      "Wilbur was sold as a “teacup” piglet, the kind promised to stay small. He didn’t. “Teacup” is a sales label, not a breed, and piglets sold that way keep growing like any other pig. Three years later, his former owner could no longer keep the full-sized pig he had become, and in November 2013 Wilbur was out of options and facing homelessness—until he found his permanent home with us.",
      "From the very start, Wilbur made his presence known. Within 60 seconds of meeting the other pigs, he established himself as the unquestioned alpha male. Over the years, he’s mellowed with age, though he still steps in to keep Toodles in line when things get a little too rowdy. At around 175 pounds, Wilbur is cool, confident, and devoted to his herd. He loves rooting in the dirt (freshly manicured lawns are his favorite!), basking in the sun for long naps, and, of course, enjoying a good meal.",
    ],
  },
  {
    id: "toodles",
    name: "Toodles",
    alt: "Toodles, a young grey Yucatan minipig, sprawled on the grass beside a green ball",
    image: "https://images.squarespace-cdn.com/content/v1/5a4fec360100276da3e4dfa1/5db72f77-db1c-4227-93e3-6fcc72c6ba99/Toodles.jpeg?format=900w",
    imageWidth: 1527,
    paragraphs: [
      "Toodles, the youngest of the bunch, looks a little different from the others because he is a Yucatan minipig—a breed specially raised for laboratories. Born in March 2022 and originally known only as “#47,” he was sold to a research lab in Silicon Valley. Luckily, he was considered an “extra” and never tested on. A sympathetic employee reached out to us, not wanting to see him euthanized, and in August 2022, Toodles arrived at Sloppy Seconds as a 5-month-old piglet.",
      "When he first came, Toodles had never set foot outside, touched grass, rooted in dirt, or felt the sun on his face. It didn’t take him long to adjust, though! Today, he’s a silly, rambunctious little character who keeps everyone on their toes. Mischievous and full of energy, Toodles has been happily embraced by the herd, and the older pigs seem especially fond of him.",
    ],
  },
  {
    id: "bentley",
    name: "Bentley",
    alt: "Bentley, an orange iguana, climbing a leafy branch",
    image: "https://images.squarespace-cdn.com/content/v1/5a4fec360100276da3e4dfa1/dc12159b-6474-4c00-b069-47d49e9dea04/Bent.jpg?format=900w",
    imageWidth: 1000,
    paragraphs: [
      "Bentley was picked up by San Francisco Animal Control many years ago after being found living with severe metabolic bone disease. When he arrived, he was already an adult and in such poor condition that he was considered unadoptable. He came to us needing a safe, permanent home where he could be cared for and live out his life with comfort and dignity.",
      "We’ve had Bentley with us for nearly 8 years now, and despite his challenges, he hasn’t let anything hold him back. He’s a confident little guy with a big personality! He loves roaming in the grass, climbing up to his swing, and eating strawberries. True to his bold nature, Bentley prefers to perch in the highest spot of his enclosure so he can look down on everyone passing by. He also enjoys being outside, soaking up the sun and surveying his kingdom from above.",
    ],
  },
  {
    id: "mustachio",
    name: "Mustachio",
    alt: "Mustachio, a red-orange bearded dragon, perched on a stack of slate",
    image: "https://images.squarespace-cdn.com/content/v1/5a4fec360100276da3e4dfa1/ff4116c4-d2fb-47da-a0ba-240fc9161fb3/34D02A02-BE24-4003-98F2-0762AB894415.JPG?format=900w",
    imageWidth: 640,
    paragraphs: [
      "Stash came to us in 2024 as a surrendered pet. His former owner paid an online reptile breeder $475 for him - a “Red Leatherback Hypo 66% Het Trans Male.” When he arrived, he was completely malnourished and could not walk! When she tried reaching out to the breeder, of course there was no response. The owner paid another $600 in vet bills and medicine. Nothing helped.",
      "Stash needed a home that would better cater to his needs and give him lots of love and care. After more vet visits, x-rays, bloodwork, and concentrated calcium drops, Stash has improved a little. He’s still not as mobile as we’d like him to be, but he’s a great eater (if he’s hand-fed) and enjoys being outside on nice sunny days.",
    ],
  },
  {
    id: "phillip",
    name: "Phillip",
    alt: "Phillip, a black and white Muscovy duck, sitting in straw inside a wire enclosure",
    image: "https://images.squarespace-cdn.com/content/v1/5a4fec360100276da3e4dfa1/1569015126626-1TLY7ARCYEFVJOWQPD8H/phillip.jpg?format=900w",
    imageWidth: 1199,
    paragraphs: [
      "Meet Philip! Philip is a Muscovy duck, born in 2019. She was dumped at a park in Modesto, and brought to Cali_FID exotics. She is the undisputed queen of the flock.  Philip has \"angel wing syndrome” because she was fed an improper diet of grains (bread, crackers, chips, etc). She will never be able to fly so she needs a protected enclosure that caters specifically to her special needs. This ducky loves watermelon, scrambled eggs, and worms!! She’s also incredibly friendly to people.",
    ],
  },
  {
    id: "jojo",
    name: "JoJo",
    alt: "JoJo, a white and grey Muscovy duck with a red face, standing in a wood and wire pen",
    image: "https://images.squarespace-cdn.com/content/v1/5a4fec360100276da3e4dfa1/1622175945370-ACCQ33II64ETKKU343X9/Jojo.jpg?format=900w",
    imageWidth: 400,
    paragraphs: [
      "Welcome JoJo to the flock! Two year old JoJo came to us in October, 2019. This pretty muscovy lady was pinioned as a duckling, so is unable to fly. Jojo is an assertive, thoughtful and cautious duck who has transitioned into the flock quite nicely. We are in love with her noises and her curious stare.",
    ],
  },
  {
    id: "buscemi",
    name: "Buscemi",
    alt: "Buscemi, a black and white guinea pig, peeking out of a plush round hide",
    image: "https://images.squarespace-cdn.com/content/v1/5a4fec360100276da3e4dfa1/09f735fe-f0a4-43d7-b60f-43c5bb844ca0/IMG_6569.JPG?format=900w",
    imageWidth: 1434,
    paragraphs: [
      "Buscemi, the venerable old man of our guinea pig crew, came to us from the City of San Jose Animal Care Center after being surrendered along with dozens of others. He arrived with a mouth laceration and swollen lip, which made him unadoptable at the shelter. We don’t know exactly how old he is, but his calm, steady presence makes him feel like the wise elder of the group.",
      "With time and love, Buscemi has fully adjusted and is no longer skittish. He especially enjoys being held, soaking up attention, and has a special fondness for children. When he’s not snuggled in someone’s arms, you can usually find him happily crunching on peppers and greens or tucked into a cozy box hide. His enclosure sits directly beneath Orlando’s, and the two carry on lively conversations throughout the day—companionship in their own unique way.",
    ],
  },
  {
    id: "nala",
    name: "Nala",
    alt: "Nala, a grey squirrel, holding a strawberry on a wooden perch in her enclosure",
    image: "https://images.squarespace-cdn.com/content/v1/5a4fec360100276da3e4dfa1/6590f2d2-27dd-4ae9-9f97-1c149e2373f9/IMG_6571.JPG?format=900w",
    imageWidth: 640,
    paragraphs: [
      "Nala was born in June 2020. She was found two months later and kept as a pet. She lived in a hamster cage and was fed an improper diet (scrambled eggs and peanuts). On November 27, 2020 she was surrendered to Yggdrasil Urban Wildlife Rescue (YUWR). It was determined that Nala had malnutrition and subsequent Metobolic Bone Disease. She was not a good candidate for the ReWild Program, unfortunately, so YUWR asked if we could keep her here permanently.",
      "Nala especially enjoys pecans, apple slices, and lounging around in her hammock. She loves getting new browse and exploring novel enrichment too!",
    ],
  },
  {
    id: "phoebe",
    name: "Phoebe",
    alt: "Phoebe, a grey chinchilla, looking straight at the camera",
    image: "https://images.squarespace-cdn.com/content/v1/5a4fec360100276da3e4dfa1/06df6aa5-fe1d-4d48-8b74-d0acd282f1bf/image0.jpg?format=900w",
    imageWidth: 1112,
    paragraphs: [
      "Phoebe came to us in 2024 from another local rescue. Phoebe had been there for many months with no interest. She chews her fur and often has missing chunks all over her body. When the rescue saw all of their furry chins getting adopted, they had to wonder why no one was choosing Phoebe.  It was said that she may be “too ugly to be adopted!!”",
      "We don’t think Phoebe is ugly - we think Phoebe is a gorgeous chinchilla with the sweetest face. We love having her here! Pheobe is a demanding little lady - if we dare walk past her without paying attention she will throw sticks at us until we come say hi! Pheobe also enjoys her dust bath and loves snacking on Cheerios and goji berries. She has been doing much better with her fur chewing and only has a few small missing patches now.",
    ],
  },
  {
    id: "blanche",
    name: "Blanche",
    alt: "Blanche, an ornate box turtle with a misshapen shell, held in a hand above the grass",
    image: "https://images.squarespace-cdn.com/content/v1/5a4fec360100276da3e4dfa1/1626047744156-85VW8JYBBJDLBDSRH22O/Blanche.jpg?format=900w",
    imageWidth: 431,
    paragraphs: [
      "Blanche spent the first 18+ years of her life in a fish tank, living on sand. Her former owners thought she was a “sand turtle” (a desert tortoise), but in reality, she’s an Ornate Box Turtle. Sadly, that misunderstanding—and many years of improper care—left Blanche with a severely deformed shell and beak. Despite these challenges, she has shown incredible resilience and a gentle spirit.",
      "Since coming to us, Blanche has flourished. She enjoys a wide variety of foods, delights in long, warm baths, and spends her summers outdoors in the sunshine before moving back inside for the winter. Though her past left its mark on her, Blanche continues to thrive with the care and love she now receives. Blanche is proof that even after decades of hardship, it’s never too late for a fresh start.",
    ],
  },
];

export const crewRows: readonly (readonly string[])[] = [
  ["brewster", "frida", "bella"],
  ["wilbur", "toodles"],
  ["bentley", "mustachio"],
  ["phillip", "jojo"],
  ["buscemi", "nala"],
  ["phoebe", "blanche"],
];

