/**
 * Return parameters of the Roll
 * @param {Roll} roll 
 * @returns {Object} {numberOfDices, explodeOn, modficator}
 */
export default function wolsungRollFormat(roll) {
    const dices = roll.terms[0].terms.length;
    const explode = roll.terms[0].terms[0].split('=')[1];
    let bonus;
    if (roll.terms[1].operator == "+") bonus = roll.terms[2].number;
    else bonus = -roll.terms[2].number;
    
    return {numberOfDices: dices, explodeOn: explode, modificator: bonus};
}