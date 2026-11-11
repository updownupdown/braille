// Practice text for Read (sweep) and Type: everyday phrases, signs, and text with numbers and symbols.
// Fixed lists are mixed with generated ones so lines rarely repeat.

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rint = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

export const PHRASES = `the quick brown fox jumps over the lazy dog
braille is read with the fingertips
six dots make every letter
we went for a walk by the lake
the kettle is on if you want tea
my sister lives in the next town
the bus was late again this morning
please close the door behind you
the snow fell all night long
we had pancakes with maple syrup
the cat is asleep on the warm rug
can you help me carry these bags
the library opens at ten
i left my keys in the car
the garden needs more water
we watched the sun go down
the bread is fresh from the oven
turn left at the next corner
the dog wants to go outside
it is going to rain later
the train leaves from the main station
my phone is almost out of power
there is a chair by the window
we planted tomatoes in the spring
the store is closed on holidays
she reads a book every week
the soup is too hot to eat
he plays the guitar after dinner
the children ran across the field
the river is high after the storm
put the milk back in the fridge
the movie starts in ten minutes
we need to buy more coffee
the leaves turn red in the fall
my brother is learning to cook
the meeting is in the big room
there are birds in the old tree
the car is parked across the street
i will call you when i get home
the bike has a flat tire
the hockey game went to overtime
she painted the fence white
the museum is free on fridays
we found a quiet table in the back
the light in the hall is out
he forgot his umbrella at work
the baby is finally asleep
we took the ferry to the island
the bakery sells good muffins
the wind is strong near the water
my friend sent me a postcard
the market is busy on saturday
the moon is bright tonight
we built a fire at the camp
the window was left open
the teacher wrote on the board
there is a long line at the bank
the pool closes at nine
the apples are ripe and sweet
i like to read before bed
she wore a warm wool hat
the clock on the wall is slow
the mail came early today
we packed a lunch for the trip
the music was too loud
the boat drifted toward the shore
the road was icy this morning
he lost a button on his coat
the kids built a snowman
the shop on the corner sells flowers
we had a picnic in the park
the door handle is on the right
the coffee shop is very busy
my grandmother knits socks
the hill is steep but short
the path follows the river
please speak a little slower
the plant needs more light
we heard thunder in the distance
the paint is still wet
the stars are out tonight
my bag is under the seat
the sandwich has cheese and ham
we waited for the green light
the cabin is near the lake
he wrote a letter to his aunt
the grass is wet with dew
the elevator is out of order
she runs every morning before work
the house smells like fresh bread
the pond froze over last night
my shoes are by the door
the waiter brought more water
the fox ran into the woods
we stayed up late talking
the radio is playing old songs
the room has a view of the city
he fixed the leaking tap
the soup needs more salt
we sat on the porch all evening
the kitten chased a piece of string
the ice cream melted in the sun
the roof needs new shingles
she baked a cake for the party
the trail is closed for repairs
the lamp is next to the bed
we cheered for the home team
the cookies are in the blue jar
the bridge opens for tall ships
the kids are playing in the yard
he takes the subway to work
we drove north to the cottage
the fridge is making a strange noise
she found a coin on the sidewalk
the sky turned pink at sunset
the tea is too sweet for me
my cousin moved to the coast
the candle burned all night
the beach was empty in the morning
we raked the leaves into piles
the store has fresh corn today
he hung the picture on the wall
the geese flew south in a long line
the sweater is soft and warm
the band played in the square
the bus stop is across the road
we planted a maple tree
she laughed at the old joke
the porch light is on
the dog barked at the mail carrier
we shared a pizza after the game
the city is quiet on sunday
the soup and bread were delicious
the blue boat is tied to the dock
please wash your hands before dinner
the theatre was full last night
he caught three fish this morning
the hallway is long and narrow
my watch stopped at noon
the puzzle has a thousand pieces
the canoe slid across the calm lake
the farmer sells eggs at the gate
we listened to the rain on the roof
the stairs are to the left of the door
knowledge is power
practice makes perfect
every little bit helps
better late than never
one step at a time
home is where the heart is
the early bird gets the worm
actions speak louder than words
there is no place like home
slow and steady wins the race
look before you leap
time flies when you are having fun
many hands make light work
it takes two to tango
all good things come to an end
where there is a will there is a way
the more the merrier
easy come easy go
a picture is worth a thousand words
great minds think alike
honesty is the best policy
laughter is the best medicine
when in doubt ask
two heads are better than one
the best things in life are free
rome was not built in a day
do not count your chickens before they hatch
it is never too late to learn
you can do it
thank you very much
see you later
have a nice day
good morning
good night
how are you today
nice to meet you
happy birthday to you
welcome to our home
where is the nearest station
what time is it
how much does this cost
could you say that again
i am learning braille
which way is the exit
is this seat taken
excuse me please
i would like a cup of tea
where are the washrooms
can i have the bill please
let me know if you need anything
see you next week
take care of yourself
enjoy your meal
congratulations on the new job
get well soon
safe travels
merry christmas and happy new year`.split('\n');

// Signage phrases: building signs, directions and notices.
export const SIGNS = `exit
emergency exit
no exit
entrance
main entrance
accessible entrance
push
pull
washroom
men
women
all gender washroom
family washroom
elevator
stairs
stairs to roof
in case of fire use stairs
do not use elevator in case of fire
fire alarm
fire extinguisher
first aid
information
reception
office
lobby
kitchen
staff only
authorized personnel only
private
please knock
meeting room
conference room
quiet please
library
gym
cafeteria
parking
visitor parking
loading dock
mechanical room
electrical room
storage
janitor
lost and found
mail room
elevator lobby
ticket office
waiting room
platform
gate
baggage claim
customs
departures
arrivals
pharmacy
emergency department
patient rooms
nurse station
x-ray
laboratory
chapel
gift shop
classroom
principal
gymnasium
change room
showers
lockers
pool
sauna
caution wet floor
watch your step
mind the gap
keep right
keep left
do not enter
wrong way
one way
no smoking
no parking
no admittance
please wait to be seated
open
closed
open daily
closed for repairs
out of order
this door must remain closed
door alarmed
emergency use only
area of refuge
evacuation route
assembly point
press for assistance
call for help
ring bell for service
deliveries
recycling
garbage
compost
drinking water
water fountain
coat check
box office
theatre
gallery
museum shop
visitor centre
trail head
lookout
campground
picnic area
boat launch
beach access
bike parking
taxi stand
bus stop
subway
train station
ferry terminal
wheelchair accessible
priority seating
please give up this seat
next stop
doors open on the left
doors open on the right
hold the handrail
caution step down
low ceiling
automatic door
please use other door
service counter
cashier
customer service
fitting rooms
toilet
baby change
nursing room
prayer room
smoking area
pets welcome
service animals welcome
no dogs allowed
no cell phones
please turn off your phone
silence please
staff entrance
fire door keep closed
exit only
entrance only`.split('\n');

const ROOMS = ['room', 'suite', 'office', 'classroom', 'unit'];
const PLACES = ['washrooms', 'elevators', 'stairs', 'exit', 'cafeteria', 'library', 'parking', 'information desk', 'meeting rooms', 'gym'];
const DIRS = ['left', 'right', 'ahead', 'down the hall', 'on the second floor', 'on the lower level', 'past the elevators'];
// Generated signs: room numbers, floors, directions.
export function signLine() {
  const r = Math.random();
  if (r < 0.3) return pick(SIGNS);
  if (r < 0.5) return `${pick(ROOMS)} ${rint(1, 9)}${rint(0, 2)}${rint(0, 9)}`;
  if (r < 0.65) return `floor ${rint(1, 12)}`;
  if (r < 0.8) return `${pick(PLACES)} ${pick(DIRS)}`;
  if (r < 0.9) return `elevator to floors ${rint(1, 4)} to ${rint(5, 20)}`;
  return `${pick(ROOMS)} ${rint(100, 499)} to ${rint(500, 999)}`;
}

// Text with numbers, money, times, dates and punctuation.
const ITEMS = ['coffee', 'muffin', 'sandwich', 'ticket', 'book', 'shirt', 'bus pass', 'pizza', 'lamp', 'bike'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const NUM_FIXED = `Open 9 to 5, Monday to Friday.
Call 911 in an emergency.
The bus leaves at 7:45.
Population: 2,794,356.
Save 20% this week!
Gate 14 is boarding now.
Platform 3 for trains to Ottawa.
Chapter 12, page 207.
Mix 2 cups of flour with 1 cup of milk.
The game ended 4-3 in overtime.
It's 22° outside today.
Room 1104, Building B.
Speed limit 50.
Check-in is at 3 p.m.
The store closes at 9:30 tonight.
We need 3 eggs, 2 apples and 1 loaf of bread.
The trip is 450 km.
Doors open at 6:30; the show starts at 7.
Tickets: $25 (adults), $10 (children).
My flight is at 6:05 a.m.!
Turn left in 300 metres.
Is it 4 or 5 o'clock?
The year was 1824.
Louis Braille was born in 1809.
UEB was adopted in Canada in 2015.
Add 1/2 a teaspoon of salt.
Mile 0 of the Trans-Canada Highway.`.split('\n');
export function numberLine() {
  const r = Math.random();
  if (r < 0.3) return pick(NUM_FIXED);
  if (r < 0.45) return `${pick(['A', 'One', 'The'])} ${pick(ITEMS)} costs $${rint(1, 60)}.${pick(['00', '25', '50', '75', '99'])}.`;
  if (r < 0.6) return `See you ${pick(DAYS)} at ${rint(1, 12)}:${pick(['00', '15', '30', '45'])}!`;
  if (r < 0.72) return `${pick(MONTHS)} ${rint(1, 28)}, ${rint(1950, 2030)}`;
  if (r < 0.84) return `${rint(2, 12)} + ${rint(2, 12)} = ?`;
  if (r < 0.92) return `Call ${rint(200, 999)}-${rint(200, 999)}-${rint(1000, 9999)}.`;
  return `${rint(10, 95)}% of ${rint(2, 9) * 100} is how many?`;
}
