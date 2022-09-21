const players = [
  'shark',
  'jelly',
  'octopus',
  'orca',
  // 'snake',
  // 'lion',
]

let currentPlayer = 0
let currentDadoNumber = 0
let isGameOver = false
const waitTime = 300

const $ = x => document.querySelector(x)
const $all = x => document.querySelectorAll(x)

// -------------------- dado --------------------
function throwDado() {
  const number = Math.floor(Math.random() * 6) + 1
  $('.dado i').remove()
  $('.dado').insertAdjacentHTML('afterbegin', `<i class="shake dado--${number}"></i>`)
  currentDadoNumber = number
}

// -------------------- players --------------------
$all('.players li').forEach((item, i) => {
  const player = players[i]
  item.dataset.player = player
  item.querySelector('i').style.backgroundImage = `url(/animals/${player}.png)`
})

// -------------------- spots --------------------
class Spot {
  constructor(x, y, node, type = null) {
    this.x = x
    this.y = y
    this.node = node
    this.type = type
  }
}

const spots = []
$('.spots').querySelectorAll('li').forEach(spot => {
  spot.style.setProperty('--x', spot.dataset.x)
  spot.style.setProperty('--y', spot.dataset.y)
  spots.push(
    new Spot(spot.dataset.x, spot.dataset.y, spot, spot.dataset.type)
  )
})

// -------------------- animals --------------------
class Animal {
  constructor(index, type, node) {
    this.index = index
    this.type = type
    this.node = node

    this.currentSpot = 0
    this.newSpot = 0
    this.node.addEventListener('transitionend', () => {
      this.step()
    })

    this.powerPoints = 0
    this.defenseAttackPoints = 0
    this.defenseMovePoints = 0
    this.canAttack = false
    this.attackArea = []

    this.canPlay = true
    this.turn = false

    this.totalAttacks = 0
    this.totalAttacked = 0
    this.totalAttacksDefenses = 0
    this.totalMovesDefenses = 0
  }

  updateLocation(amount) {
    this.newSpot = this.currentSpot + amount
    this.step()
  }

  step() {
    // check game over
    if (this.currentSpot > 49) {
      this.currentSpot = 49
      isGameOver = true
    }

    // step or check
    if (this.currentSpot < this.newSpot) {
      this.currentSpot++
    } else if (this.currentSpot > this.newSpot) {
      this.currentSpot--
    } else {
      this.checkSpot()
      this.node.classList.remove('attacked')
    }

    // check returning
    if (this.new <= 0) {
      this.currentSpot = 0
      next()
      return
    }

    // update ui coords
    const spotToGo = spots[this.currentSpot-1]
    this.node.style.setProperty('--x', spotToGo.x)
    this.node.style.setProperty('--y', spotToGo.y)
    this.node.dataset.x = spotToGo.x
    this.node.dataset.y = spotToGo.y
  }

  checkAttack() {
    if (this.turn && this.powerPoints > 0 && this.canAttack) {
      // update attack area
      if (this.type === 'shark') {
        this.attackArea = []
        const behind = this.currentSpot - 4
        const forward = this.currentSpot + 4
        for (let i = behind-1; i < forward; i++) {
          this.attackArea.push(i)
        }
      } else {
        this.attackArea = []
        const forward = this.currentSpot + 5
        for (let i = this.currentSpot-1; i < forward; i++) {
          this.attackArea.push(i)
        }
      }

      // search in attack area
      let FoundOneToAttack = null
      for (let i = this.attackArea[this.attackArea.length-1]; i >= this.attackArea[0]; i--) {
        const animalToAttack = animals.find(animal => animal !== this && animal.currentSpot-1 === i)

        // found a animal
        if (animalToAttack != null) {
          FoundOneToAttack = animalToAttack
          break
        }
      }

      // attack if can
      if (FoundOneToAttack) {
        this.attack(FoundOneToAttack)
      } else {
        next()
      }
    } else {
      this.canAttack = this.powerPoints > 0 ? true : false
      next()
    }
  }

  attack(animalToAttack) {
    console.log(this.type, 'attacking', animalToAttack.type)

    // decrease power point
    this.powerPoints -= 1
    const powerUI = $(`.players [data-player="${this.type}"] [data-power]`)
    powerUI.dataset.power = this.powerPoints
    powerUI.innerText = `Power: ${this.powerPoints}`

    // add special effect
    this.node.insertAdjacentHTML('beforeend', '<div class="blast"></div>')
    const blastEl = this.node.querySelector('.blast')
    const dx = animalToAttack.node.dataset.x - this.node.dataset.x
    const dy = animalToAttack.node.dataset.y - this.node.dataset.y
    blastEl.style.setProperty('--x', dx)
    blastEl.style.setProperty('--y', dy)
    $('#drop').play()

    // increment attacks count
    this.totalAttacks++
    $(`.players li[data-player=${this.type}] span[data-total-attacks]`).innerText = `Total Attacks: ${this.totalAttacks}`

    // actuallly attack
    blastEl.addEventListener('animationend', () => {
      blastEl.remove()

      if (animalToAttack.defenseAttackPoints > 0) {
        // increment attack defenses count
        animalToAttack.totalAttacksDefenses++
        $(`.players li[data-player=${animalToAttack.type}] span[data-total-attacks-defenses]`).innerText = `Total Attacks Defenses: ${animalToAttack.totalAttacksDefenses}`

        // add special effect
        animalToAttack.node.insertAdjacentHTML('beforeend', '<div class="shield"></div>')
        const shield = animalToAttack.node.querySelector('.shield')
        shield.addEventListener('animationend', function () {
          setTimeout(() => {
            shield.remove()
            this.removeEventListener('animationend', this)
          }, 400);
        })
        $('#drop').play()

        animalToAttack.updateDefensePoint(0, 'decrease')
        $('#fart').play()
        setTimeout(() => {
          next()
        }, waitTime)
      } else {
        // increment attack defenses count
        animalToAttack.totalAttacked++
        $(`.players li[data-player=${animalToAttack.type}] span[data-total-attacked]`).innerText = `Total Attacked: ${animalToAttack.totalAttacked}`
        
        $('#auch').play()
        switch (this.type) {
          case 'shark':
            this.attackPull(animalToAttack, -2)
            break
          case 'orca':
            this.attackPull(animalToAttack, -3)
            break
          case 'octopus':
            throwDado()
            setTimeout(() => {
              this.attackPull(animalToAttack, currentDadoNumber*-1)
              // this.attackPull(animalToAttack, -1)
            }, waitTime)
            break
          case 'jelly':
            this.attackFreeze(animalToAttack)
            break
          case 'snake':
            this.attackFreeze(animalToAttack)
            break
          case 'lion':
            this.attackFreeze(animalToAttack)
            break
        }
      }
    })
    return
  }

  attackPull(animalToAttack, amount) {
    animalToAttack.node.classList.add('attacked')
    animalToAttack.updateLocation(amount)
  }

  attackFreeze(animalToAttack) {
    animalToAttack.canPlay = false
    $(`.players li[data-player=${animalToAttack.type}]`).classList.add('cant-play')
    animalToAttack.node.classList.add('cant-play')
    setTimeout(() => {
      next()
    }, waitTime)
  }
  
  cardPowerSpot(cSpot) {
    blowAnimation(cSpot, 'blue')

    this.powerPoints += 1
    const powerUI = $(`.players [data-player="${this.type}"] [data-power]`)
    powerUI.dataset.power = this.powerPoints
    powerUI.innerText = `Power: ${this.powerPoints}`

    setTimeout(() => {
      this.checkAttack()
    }, waitTime)
  }

  updateDefensePoint(defenseType, mode) {
    if (defenseType === 0 && mode === 'increase') {
      console.log(this.type, '+ carta defesa ataque')
    }
    if (defenseType === 1 && mode === 'increase') {
      console.log(this.type, '+ carta defesa movimento')
    }
    if (defenseType === 0 && mode === 'decrease') {
      console.log(this.type, '- carta defesa ataque')
    }
    if (defenseType === 1 && mode === 'decrease') {
      console.log(this.type, '- carta defesa movimento')
    }
    if (defenseType === 0) {
      this.defenseAttackPoints = mode === 'increase' ? this.defenseAttackPoints += 1 : this.defenseAttackPoints -= 1
      const defenseAttackUI = $(`.players [data-player="${this.type}"] [data-defense-attack]`)
      // defenseAttackUI.dataset.defenseAttack = this.defenseAttackPoints
      defenseAttackUI.innerText = `Defense Attacks: ${this.defenseAttackPoints}`
    } else {
      this.defenseMovePoints = mode === 'increase' ? this.defenseMovePoints += 1 : this.defenseMovePoints -= 1
      const defenseMovekUI = $(`.players [data-player="${this.type}"] [data-defense-move]`)
      // defenseMovekUI.dataset.defenseMove = this.defenseMovePoints
      defenseMovekUI.innerText = `Defense Moves: ${this.defenseMovePoints}`
    }
  }

  cardDefenseSpot(cSpot) {
    blowAnimation(cSpot, 'green')

    const defenseType = Math.round(Math.random())
    this.updateDefensePoint(defenseType, 'increase')

    setTimeout(() => {
      this.checkAttack()
    }, waitTime)
  }

  cardMoveSpot(cSpot) {
    blowAnimation(cSpot, 'orange')

    const moveType = Math.round(Math.random())
    const moveAmount = Math.floor(Math.random() * 6) + 1

    setTimeout(() => {
      if (moveType === 0) {
        $('#power').play()
        this.updateLocation(moveAmount)
      } else {
        if (this.defenseMovePoints > 0) {
          // increment move defenses count
          this.totalMovesDefenses++
          $(`.players li[data-player=${this.type}] span[data-total-moves-defenses]`).innerText = `Total Moves Defenses: ${this.totalMovesDefenses}`

          // animation
          const assetToSpin = this.node.querySelector('i')
          assetToSpin.classList.add('burp')
          assetToSpin.addEventListener('animationiteration', function() {
            assetToSpin.classList.remove('burp')
            this.removeEventListener('animationend', this)
          });
          $('#burp').play()

          this.updateDefensePoint(1, 'decrease')
          setTimeout(() => {
            next()
          }, waitTime);
        } else {
          $('#quack').play()
          this.updateLocation(moveAmount*-1)
        }
      }
    }, waitTime);
    
  }

  flowSpot(cSpot, color, amount) {
    blowAnimation(cSpot, color)
    setTimeout(() => {
      this.updateLocation(amount)
    }, waitTime)
  }

  checkSpot() {
    const cSpot = spots[this.currentSpot-1]

    switch (cSpot.type) {
      case '+2':
        this.flowSpot(cSpot, 'green', 2)
        $('#power').play()
        break
      case '+3':
        this.flowSpot(cSpot, 'green', 3)
        $('#power').play()
        break
      case '-2':
        this.flowSpot(cSpot, 'red', -2)
        $('#quack').play()
        break
      case '-3':
        this.flowSpot(cSpot, 'red', -3)
        $('#quack').play()
        break
      case '-4':
        this.flowSpot(cSpot, 'red', -4)
        $('#quack').play()
        break
      case 'power':
        this.cardPowerSpot(cSpot)
        $('#beep').play()
        break
      case 'defense':
        this.cardDefenseSpot(cSpot)
        $('#beep').play()
        break
      case 'move':
        this.cardMoveSpot(cSpot)
        break
      default:
        this.checkAttack()
        break
    }
  }
}
 
const animals = []
$all('.animals li').forEach((animal, i) => {
  animal.querySelector('i').style.backgroundImage = `url(/animals/${players[i]}.png)`
  animals.push(
    new Animal(i, players[i], animal)
  )
})

// -------------------- actions --------------------

setTimeout(() => {
}, 2000)
// next()

function next() {

  if (isGameOver) {
    return
  }
  
  let cAnimal = animals[currentPlayer]

  if (!cAnimal.canPlay) {
    cAnimal.canPlay = true
    $(`.players li[data-player=${cAnimal.type}]`).classList.remove('cant-play')
    cAnimal.node.classList.remove('cant-play')
    nextPlayer()
    cAnimal = animals[currentPlayer]
  }

  $all('.players li').forEach((player, i) => {
    player.classList.remove('current')
    if (i === currentPlayer ) player.classList.add('current')
  })

  animals.forEach(animal => {
    animal.turn = false
    if (animal === cAnimal) animal.turn = true
  })

  setTimeout(() => {
    throwDado()
    setTimeout(() => {
      cAnimal.updateLocation(currentDadoNumber)
      // cAnimal.updateLocation(2)

      nextPlayer()
    }, waitTime)
  }, waitTime*2)
}

function blowAnimation(spot, color) {
  const el = document.createElement('i')
  el.classList.add(color)
  el.addEventListener('animationend', function () {
    this.removeEventListener('animationend', this)
    this.remove()
  })
  spot.node.appendChild(el)
}

function nextPlayer() {
  currentPlayer = currentPlayer < 3 ? currentPlayer+1 : 0
}

