import { List, Map } from 'immutable';

export const INITIAL_STATE = Map();

export function setEntries(state, entries) {
  return state.set('entries', List(entries));
}


function getWinners(vote) {
  if (!vote) return [];
  const [a,b] = vote.get('pair');
  const aVotes = vote.getIn(['tally', a], 0);
  const bVotes = vote.getIn(['tally', b], 0);
  if (aVotes > bVotes) return [a];
  else if (aVotes > bVotes) return [b];
  else return [a, b];
}

/**
 * When next is called 
 * 1) add the winner of the vote to the entries again
 * 2) if there's a single entry left,
 *   set a winner, remove entries
 * 3) if there are > 2 entries left
 *   update the round
 *   update the pair with the next 2 entries
 *   update the entries with the pair removed
 */
export function next(state) {
  const entries = state.get('entries')
    .concat(getWinners(state.get('vote')));

  if (entries.size === 1) {
    return state.remove('vote')
      .remove('entries')
      .set('winner', entries.first());
  } else {
    return state.merge({
      vote: Map({ 
        round: state.getIn(['vote', 'round'], 0) + 1,
        pair: entries.take(2) 
      }),
      entries: entries.skip(2),
    });
  }
}

export function vote(state, entry) {
  
  if (!state.get('pair').includes(entry)) {
    return state;
  }

  return state.updateIn(
    ['tally', entry],
    0,
    tally => tally + 1
  );
}