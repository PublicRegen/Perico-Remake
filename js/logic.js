const htmlElements = {
  gold: document.querySelector('#gold'),
  weed: document.querySelector('#weed'),
  cash: document.querySelector('#cash'),
  cocaine: document.querySelector('#cocaine'),
  paintings: document.querySelector('#paintings'),
  amountOfPlayers: document.querySelector('#amountOfPlayers'),
}
Object.entries(htmlElements).forEach(([setting, elementHTML]) => {
  elementHTML.value = +Settings[setting];
});
document.querySelector('#isHardMode').checked = Settings.isHardMode;
document.querySelector('#primaryTarget').value = Settings.primaryTarget;


const Counter = {
  targetsData: {},
  secondaryTargetsOrder: [],

  init: function () {
    return Loader.promises['targets'].execute(data => {
      Counter.targetsData = data;
      Counter.targetsData.targets.secondary.forEach(({ name, value, weight }) => {
        Counter.secondaryTargetsOrder.push({ name, bag_profit: value / weight });
      });
      Counter.secondaryTargetsOrder.sort((...args) => {
        const [a, b] = args.map(({ bag_profit }) => bag_profit);
        return b - a;
      });
      Counter.getLoot();
    });
  },
  getLoot: function () {
    let amounts = [];
    let bagsFill = 0;
    let emptySpace = Settings.amountOfPlayers;
    let totalValue = 0;
    const isHardMode = (Settings.isHardMode ? 'hard_mode' : 'easy_mode');
    const players = Settings.amountOfPlayers;

    Counter.secondaryTargetsOrder.forEach(element => {
      if (emptySpace < .1) return;
      emptySpace = players - bagsFill;
      const obj = Counter.targetsData.targets.secondary.find(object => object.name === element.name);
      // if (players == 1 && obj.name === 'gold') return;
      if (obj.name === 'paintings' && emptySpace < .5) return;
      const maxFill = Settings[obj.name] * obj.weight;
      let realFill = maxFill >= players ? players : maxFill;
      bagsFill += +realFill;
      realFill = realFill > emptySpace ? emptySpace : realFill;
      if (realFill < 0.1) return;
      amounts.push({ name: obj.name, amount: realFill });
      totalValue += realFill * (obj.value / obj.weight);
    });
    const finalValue = totalValue + Counter.targetsData.targets.primary[isHardMode].find(e => e.name === Settings.primaryTarget).value;
    Counter.updateWebsite(amounts, finalValue);
  },
  updateWebsite: function (amounts, totalValue) {
    document.querySelector('#max-loot-value').innerHTML = Math.round(totalValue).toLocaleString();
    document.querySelectorAll('.big').forEach(e => {
      e.innerHTML = 0;
      e.parentElement.classList.add("hidden");
    });
    amounts.forEach(object => {
      const amount = Number(object.amount).toFixed(1);
      const element = document.querySelector(`#${object.name}-bag`);
      if (amount !== 0) {
        element.innerHTML = `${amount} ${object.name} bag${amount > 1 ? 's' : ''}`;
        element.parentElement.classList.remove("hidden");
      }
    });
  },
  activateHandlers: function () {
    document.querySelector('#isHardMode').addEventListener('change', () => {
      Settings.isHardMode = !!isHardMode.checked;
    });
    document.querySelector('#primaryTarget').addEventListener('change', () => {
      Settings.primaryTarget = primaryTarget.value;
    });

    Object.values(htmlElements).forEach(element => {
      element.addEventListener('change', event => {
        Settings[event.currentTarget.id] = +event.target.value;
      });
    });

    SettingProxy.addListener(Settings, 'gold weed cash cocaine paintings primaryTarget amountOfPlayers isHardMode', Counter.getLoot);
  }
}

const findError = callback => (...args) => callback(args).catch(err => console.log(err));

function initLogic() {
  const initCounter = Counter.init();

  Promise.all([initCounter])
    .then(Counter.activateHandlers)
    .then(Loader.resolveContentLoaded);
};

document.addEventListener('DOMContentLoaded', () => {
  try {
    initLogic();
  }
  catch (error) {
    console.log(error);
    alert(error);
  }
});
