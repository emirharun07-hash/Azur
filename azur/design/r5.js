/* Tie-break (Stechen) after the final, voted by the partner: only the cards the partner said yes to in round 4.
   Swipe as usual: no = out, yes = stays; after each pass only the yes cards come again until one is left, and a
   star makes a card the winner at once. The phone card is left out (it shows the phone version of the others), and
   the six liked animations combine, so they need no tie-break. */
const PICK5 = {
  pdp: ['mlineup', 'glineup'],
  shop: ['cardsize', 'classiccardsize', 'classiccards', 'quicksize', 'cardflip'],
  color: ['floodbar', 'floodcone', 'floodamber', 'floodneon', 'floodlight', 'turf', 'whiteyellow'],
};
const pick5 = (list, k) => PICK5[k].map(key => list.find(l => l.key === key));
const PDP5 = pick5(PDP4, 'pdp'), SHOP5 = pick5(SHOP4, 'shop'), ANIM5 = [], COLOR5 = pick5(COLOR4, 'color');
