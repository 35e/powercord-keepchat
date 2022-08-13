// Port from vizality plugin "Who Said What"
// Vizality plugin: https://github.com/valentinegb/who-said-what

const { Plugin } = require('powercord/entities');
const { getModule } = require('powercord/webpack');

const regModule = getModule(['register'], false);
let interval;
let index = 0;
let original;

module.exports = class MessageLog extends Plugin {
  async startPlugin() {
    let deleted = [];

		const styleMessage = async ({ id }) => {
			let el = document.getElementById(`chat-messages-${id}`);
			if (!el) return;
			if (el.classList.contains('deleted-message')) return;
			el.classList.add('deleted-message');
		};

		const run = () => {
			for (let obj of deleted) {
				styleMessage(obj);
			}
		};

		const getHandler = (regModule) => {
			return regModule._actionHandlers._orderedActionHandlers.MESSAGE_DELETE.find(e => e.actionHandler.toString().includes('revealedMessageId'));
    };

		const setup = () => {
			try {
				original = getHandler(regModule);
			} catch (e) {
				return setTimeout(setup, 1000);
			}

			index = regModule._actionHandlers._orderedActionHandlers.MESSAGE_DELETE.indexOf(
				getHandler(regModule)
			);

			const originalActionHandler =
				regModule._actionHandlers._orderedActionHandlers.MESSAGE_DELETE[index].actionHandler;
			const originalstoreDidChange =
				regModule._actionHandlers._orderedActionHandlers.MESSAGE_DELETE[index].storeDidChange;

			regModule._actionHandlers._orderedActionHandlers.MESSAGE_DELETE[index] = {
				actionHandler: (obj) => {
					if (document.getElementById(`chat-messages-${obj.id}`)?.className.includes('ephemeral')) {
						return originalActionHandler(obj);
          }

					if (deleted.find((x) => x.id === obj.id)) return;

					deleted.push(obj);
					styleMessage(obj);
				},

				storeDidChange: (obj) => {
					if (document.getElementById(`chat-messages-${obj.id}`)?.className.includes('ephemeral')) {
						return originalstoreDidChange(obj);
          }
				}
			};
		};

		interval = setInterval(run, 300);
		this.loadStylesheet('./styles.css');
		setup();
  }

  async pluginWillUnload() {
    clearInterval(interval);

		for (let e of document.getElementsByClassName('deleted-message')) {
			e.remove();
		}

		regModule._actionHandlers._orderedActionHandlers.MESSAGE_DELETE[index] = original;
  }
}
