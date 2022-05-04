import WolsungCardSelectDialog from "../applications/WolsungCardSelectDialog.mjs";

export default class WolsungHandMiniBar extends HandMiniBar {

    // Config drag event to be compatible with Wolsung Cards and Zetons behavior
    drag(event) {
        const cardId = $(event.currentTarget).data("card-id");
        const card = this.currentCards.data.cards.get(cardId);
        if ( !card ) return;

        const handId = this.currentCards.id;

        const wolsungDeckId = game.cards.getName(game.settings.get("wolsung", "wolsungDeck")).id;
        const zetonDeckId = game.cards.getName(game.settings.get("wolsung", "zetonDeck")).id;

        const dragData = {
            handId: handId,
            cardId: cardId
        }
        if (card.data.origin == wolsungDeckId) dragData.type = "Karta";
        else if (card.data.origin == zetonDeckId) dragData.type = "Zeton";
        else return;

        // Set data transfer
        event.dataTransfer.setData("text/plain", JSON.stringify(dragData));

    }

    // Remove drop event
    drop(event) {}

    // Draw by using Zeton
    async drawDialog() {
        const zetonDeckId = game.cards.getName(game.settings.get("wolsung", "zetonDeck")).id;
        const hand = this.currentCards;
        const zetonList = hand.cards.filter(card => card.data.origin == zetonDeckId);
        if (zetonList.length == 0) {
            ui.notifications.error(game.i18n.localize("wolsung.handminibar.noZetons"));
            return;
        }
        return Dialog.confirm({
            title: game.i18n.localize("wolsung.handminibar.drawCards"),
            content: game.i18n.localize("wolsung.handminibar.qDrawCards"),
            yes: () => {hand.drawCards(zetonList[0]);} 
        })
    }

    async passDialog() {
        const hand = this.currentCards;
        const cardsDeckId = game.cards.getName(game.settings.get("wolsung", "wolsungDeck")).id;
        const cardsList = hand.cards.filter(card => card.data.origin == cardsDeckId);
        const discard = game.cards.getName(game.settings.get("wolsung", "discardPile"));

        return WolsungCardSelectDialog.prompt({
            title: game.i18n.localize("wolsung.handminibar.discardCardTitle"),
            label: game.i18n.localize("wolsung.handminibar.discardCardLabel"),
            content: {
                cards: cardsList,
                selectedCard: cardsList[0],
                cardId: cardsList[0].id
            },
            callback: async html => {
                const fd = new FormDataExtended(html.querySelector("form")).toObject();
                const card = hand.getEmbeddedDocument("Card", fd.cardId);
                await hand.pass(discard, [card.id], {chatNotification: false});
            },
            rejectClose: false,
            options: {jQuery: false}
        });
    }

    renderCards(resolve, reject){
        let t = this;
        $('#hand-mini-bar-card-container-' + t.id).empty();
        if(typeof this.currentCards !== "undefined"){
          let length = this.currentCards.data.cards.contents.length;
          if(CONFIG.HandMiniBar.options.faceUpMode){
            // Check to make sure all the cards are flipped over to their face
            $(this.currentCards.data.cards.contents.sort(this.cardSort)).each(function(i,c){
              if(c.face == null){
                c.flip();
              }
            });
          }
          $(this.currentCards.data.cards.contents.sort(this.cardSort)).each(function(i,c){
            let renderData = {
              id: c.data._id,
              card: c,
              back: (c.face == null),
              img: (c.face !== null) ? c.face.img : c.back.img,
              name:(c.face !== null) ? c.data.name : game.i18n.localize("HANDMINIBAR.CardBack"),
            };
            renderTemplate('systems/wolsung/templates/cards/hand-mini-bar-card.hbs', renderData).then(
                content => {
                    content = $(content);
                    $('#hand-mini-bar-card-container-' + t.id).append(content);
                    if(i == length - 1){
                      if (resolve){
                        //Return for the promise
                        resolve();
                      }
                    }
                }
            )
          });
          let handTitle = this.currentCards.data.name;
          /** Do Some Extra GM work here **/
          if(game.user.isGM){
            if(!!this.currentUser){
              handTitle = this.currentUser.data.name + " (" + handTitle + ")";
            }
          }
          this.updatePlayerColor();
          $("#hand-mini-bar-hand-name-" + t.id).html(handTitle);
          //Return for the promise if there is nothing to render
          if(length == 0){
            if (resolve){
              resolve();
            }
          }
        }
      }
    
}