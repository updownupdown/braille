// Secret Agent: short cases in rising difficulty. Easy is Grade 1 lowercase; Medium adds capitals, numbers
// and punctuation; Hard is Grade 2. The original ten-part case (MISSIONS) is added at the end in games.js.
const M = (title, brief, msg, after, grade = 1) => ({ title, brief, msg, after, grade });
export const AGENT_CASES = [
  { name: 'The lost cat', level: 'Easy', missions: [
    M('A note on the door', 'Mrs. Bell’s cat is missing. A note is taped to her door.', 'the cat is in the shed', 'The shed is empty, but a bowl of milk sits by a hole in the fence.'),
    M('The fence', 'Someone has scratched dots into the fence post.', 'go to the big oak', 'Under the big oak you find a paw print and a scrap of blue yarn.'),
    M('The yarn', 'A tag hangs from the yarn.', 'she likes the sun room', 'The neighbour’s sun room. The window is open a crack.'),
    M('Found', 'One last note on the sill.', 'the cat is safe and fed', 'Whiskers is asleep on a warm cushion. Case closed.'),
  ] },
  { name: 'The missing map', level: 'Easy', missions: [
    M('The empty desk', 'The camp leader’s map is gone. A card lies on the desk.', 'look in the mess hall', 'In the mess hall, a cup sits upside down on a table.'),
    M('Under the cup', 'Dots are pressed into a napkin under the cup.', 'the map went to the lake', 'At the lake, a canoe is pulled up on the sand.'),
    M('The canoe', 'A paddle has a message on the handle.', 'dig by the flag pole', 'Under the flag pole: a tin box, buried in sand.'),
    M('The tin box', 'Inside the box, a final note.', 'the map is in the tent', 'The map was in the leader’s own tent all along.'),
  ] },
  { name: 'Snow day', level: 'Easy', missions: [
    M('The first clue', 'The school bell was hidden before the snow day. A clue waits in the hall.', 'check the coat hooks', 'A mitten on the coat hooks has a card inside.'),
    M('The mitten', 'The card is dotted, not printed.', 'the bell is near the snow', 'Near the snow, in the yard, a snowman has a strange hat.'),
    M('The snowman', 'A note is tucked in the scarf.', 'lift the hat', 'Under the hat, wrapped in wool: the school bell.'),
    M('Ring it', 'One more note from the janitor.', 'ring the bell at noon', 'The bell rings at noon. Classes are back on.'),
  ] },
  { name: 'The museum key', level: 'Medium', missions: [
    M('Night shift', 'The museum key has gone missing. Capitals matter now.', 'Ask Sam at the Front Desk', 'Sam shrugs, then slides you a folded card.'),
    M('Sam’s card', 'Numbers start with the number sign.', 'Check Room 4 after 6', 'Room 4 holds old maps. One case is unlocked.'),
    M('The map case', 'A label inside the case.', 'Hall B, Shelf 12.', 'Shelf 12 holds a dusty box with a combination lock.'),
    M('The lock', 'A scrap under the shelf.', 'Try 3, 9, 2 and 7.', 'The lock opens. The key is inside. Case closed.'),
  ] },
  { name: 'Train 42', level: 'Medium', missions: [
    M('The platform', 'A parcel vanished from Train 42. The conductor hands you a card.', 'Look in Car 3, Seat 18.', 'Seat 18 is empty, but there is a ticket on the floor.'),
    M('The ticket', 'Dots are punched into the ticket.', 'Get off at Kingston!', 'At Kingston station, a porter waves you over.'),
    M('The porter', 'The porter’s note is short.', 'Locker 27, Code 1504.', 'Locker 27 holds a parcel with a red string.'),
    M('The parcel', 'A tag on the string.', 'Return it to Ms. Park.', 'Ms. Park is thrilled. Her grandmother’s quilt is safe.'),
  ] },
  { name: 'The radio code', level: 'Medium', missions: [
    M('Static', 'A strange broadcast was recorded. HQ sends a transcript.', 'Meet at Pier 9 at 10.', 'At Pier 9, a boat called the North Star is tied up.'),
    M('The North Star', 'A note in the wheelhouse.', 'Tune to 101.5 FM.', 'The radio crackles. A voice reads out numbers.'),
    M('The numbers', 'You write them down as dots.', 'Box 66, Lake Road, Unit 2.', 'Unit 2 is a storage room full of old radios.'),
    M('The sender', 'A sign on the last radio.', 'It was a test. Well done!', 'HQ was testing you. You passed.'),
  ] },
  { name: 'The lighthouse', level: 'Hard', missions: [
    M('Dark tower', 'The lighthouse went dark last night. This case is in Grade 2.', 'the keeper left the light on', 'So who turned it off? Fresh boot prints lead down to the rocks.', 2),
    M('The rocks', 'A message scratched on a flat stone.', 'follow the path to the cove', 'In the cove, a small boat bobs with its lantern lit.', 2),
    M('The boat', 'A logbook on the seat.', 'the switch was turned off by mistake', 'A new assistant flipped the wrong switch.', 2),
    M('Light again', 'The keeper’s final note.', 'thank you for your help tonight', 'The beam sweeps the water again. Ships are safe.', 2),
  ] },
  { name: 'The art heist', level: 'Hard', missions: [
    M('The gallery', 'A small painting is gone. Grade 2 from here.', 'the frame was left in the hall', 'The empty frame leans against the wall, with a note behind it.', 2),
    M('Behind the frame', 'The note is in contracted braille.', 'they will sell it at the market', 'The market opens at dawn. Stalls everywhere.', 2),
    M('The stall', 'A card at a busy stall.', 'ask for the painting of the river', 'The seller goes pale and points to a van.', 2),
    M('The van', 'One more card on the dashboard.', 'the painting is under the blanket', 'Under the blanket: the painting, unharmed. Case closed.', 2),
  ] },
  { name: 'The final cipher', level: 'Hard', missions: [
    M('The envelope', 'HQ sends your hardest case yet.', 'the agent should go to the station', 'At the station, a locker has your name on it.', 2),
    M('The locker', 'Inside, a card in Grade 2.', 'knowledge is the key to every door', 'A riddle. The library has a door marked Knowledge.', 2),
    M('The library', 'A book is left open on the table.', 'read the first word of each line', 'The first words spell out a time and a place.', 2),
    M('The meeting', 'The last message, from the chief.', 'you have done it and we are proud', 'You are promoted to senior agent. Congratulations.', 2),
  ] },
];
