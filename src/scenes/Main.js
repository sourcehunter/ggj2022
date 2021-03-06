import SoundControls from '../objects/SoundControls'

const GRAVITATION = 1500
const RUNNING_SPEED = 350
const ENABLE_LONG_JUMP = true
const ENABLE_DOUBLE_JUMP = false
const JUMP_SPEED = ENABLE_LONG_JUMP ? -500 : -700
const MAXIMUM_LONG_JUMP_TIME = 250
const COLLECTIBLE_MIN_SPAWN_TIME = 3000
const COLLECTIBLE_MAX_SPAWN_TIME = 5000
const COLLECTIBLE_OFFSET = 300

class Character extends Phaser.GameObjects.Container {
	constructor (scene) {
		super(scene)
		
		const overworldCharacter = new Phaser.GameObjects.Sprite(scene, 0, 0, 'white_run1')
		overworldCharacter.setOrigin(0, 1)
		overworldCharacter.play('white_run')
		scene.add.updateList.add(overworldCharacter)
		this.overworldCharacter = overworldCharacter

		const underworldCharacter = new Phaser.GameObjects.Sprite(scene, 0, 0, 'black_run1')
		underworldCharacter.setOrigin(0, 1)
		underworldCharacter.setScale(1, -1)
		underworldCharacter.play('black_run')
		scene.add.updateList.add(underworldCharacter)
		this.underworldCharacter = underworldCharacter
		
		this.speed = 0
		this.jumped = false
		this.jumping = false
		this.doubleJumped = false
		this.longJumpTime = 0
		
		this.add(overworldCharacter)
		this.add(underworldCharacter)
		
		this.footsteps = scene.sound.add('footsteps');
		this.sound_plyed = false;
	}
	
	jump () {
		if (this.isOnFloor() || (this.jumped && ENABLE_DOUBLE_JUMP && !this.doubleJumped)) {
			this.speed = JUMP_SPEED
			this.overworldCharacter.play('white_jump')
			this.underworldCharacter.play('black_jump')
			if (this.jumped && ENABLE_DOUBLE_JUMP) {
				this.doubleJumped = true
			}
			this.jumped = true
			this.jumping = ENABLE_LONG_JUMP
			this.longJumpTime = 0
		}
	}
	
	isOnFloor () {
		return this.overworldCharacter.y >= 0
	}
	
	updatePosition (deltaTime) {
		const dy = this.speed * deltaTime / 1000
		const dv = (this.jumping ? -GRAVITATION : GRAVITATION) * deltaTime / 1000
		
		this.overworldCharacter.y += dy
		this.speed += dv
		
		if (this.jumping) {
			this.longJumpTime += deltaTime
			
			if (this.longJumpTime > MAXIMUM_LONG_JUMP_TIME) {
				this.jumping = false
			}
		}
		
		if (this.overworldCharacter.y >= 0) {
			this.overworldCharacter.y = 0
			this.speed = 0
			if (this.jumped) {
				this.overworldCharacter.play('white_run')
				this.underworldCharacter.play('black_run')
				this.jumped = false
				this.doubleJumped = false
			}
		}
		
		if(this.sound_plyed === false && this.isOnFloor()) {
			this.footsteps.play({
				loop: true
			});
			this.sound_plyed = true;
		}	
		
		if(!this.isOnFloor()) {
			this.sound_plyed = false
			this.footsteps.pause();
		}
		
		this.underworldCharacter.y = -this.overworldCharacter.y
	}
	
	getWidth () {
		return this.overworldCharacter.width
	}

	getHeight () {
		return this.overworldCharacter.height
	}
	
	getY () {
		return this.y + this.overworldCharacter.y
	}

	getX () {
		return this.x + this.overworldCharacter.x
	}
}

class Obstacle extends Phaser.GameObjects.Sprite {
	constructor (scene, speed = -RUNNING_SPEED) {
		const { width, height } = scene.sys.canvas
		const index = Math.floor(Math.random() * 3) + 1
		super(scene, width, height / 2, 'obstacle' + index)
		if (Math.random() >= 0.5) {
			this.setScale(1, -1)
		}
		
		if (index === 2) {
			this.play('fire')
			scene.add.updateList.add(this)
		}
		
		this.setOrigin(0, 1)
		this.speed = speed
	}
	
	updatePosition (deltaTime) {
		const dx = this.speed * deltaTime / 1000
		
		this.x += dx
	}
}

class Collectible extends Phaser.GameObjects.Sprite {
	constructor (scene, speed = -RUNNING_SPEED) {
		const { width, height } = scene.sys.canvas
		const index = Math.floor(Math.random() * 5) + 1
		super(scene, 0, 0, 'collectible' + index)
		this.side = Math.random() >= 0.5 ? 1 : 0
		if (this.side === 1) {
			this.setScale(1, -1)
			this.setPosition(width, height / 2 + COLLECTIBLE_OFFSET)
		} else {
			this.setPosition(width, height / 2 - COLLECTIBLE_OFFSET)
		}
		
		this.setOrigin(0, 1)
		this.speed = speed
	}
	
	updatePosition (deltaTime) {
		const dx = this.speed * deltaTime / 1000
		
		this.x += dx
	}
}

class Background extends Phaser.GameObjects.Sprite {
	constructor (scene, speed = -RUNNING_SPEED*1.2) {
		const { width, height } = scene.sys.canvas
		const index = Math.floor(Math.random() * 3) + 1
		
		if (Math.random() >= 0.5) {
			super(scene, width, height * 7/8, 'obstacle' + index)
			this.setScale(-0.1, -0.1)
			this.play('crow')
		}
		else {
			super(scene, width, height / 8, 'obstacle' + index)
			this.setScale(-0.1, 0.1)
			this.play('dove')
		}
		
		
		scene.add.updateList.add(this)
		this.setOrigin(0, 1)
		this.speed = speed
	}
	
	updatePosition (deltaTime) {
		const dx = this.speed * deltaTime / 1000
		
		this.x += dx
	}
}

export default class MainScene extends Phaser.Scene {
	constructor () {
		super({ key: 'Main' })
	}

	create () {
		this.score = 0
		const scoreText = new Phaser.GameObjects.Text(this, 150, 100, '0', { fontFamily: '"Amatic SC"', fontSize: '80px', color: '#000', fontStyle: '700' })
		scoreText.setOrigin(0.5, 0.5)
		this.scoreText = scoreText
		const scoreBackground = new Phaser.GameObjects.Rectangle(this, 50, 50, 200, 100, 0xffffff, 0.4)
		scoreBackground.setOrigin(0, 0)
		const { width, height } = this.sys.canvas
		this.availableForegrounds = [1, 2, 3, 4]
		this.usedForegrounds = []
		this.availableBackgrounds = [1,2,3]
		this.usedBackgrounds = []
		// background
		this.backimage = this.add.sprite(width / 2, height / 2, 'sky' + this.selectRandomBackground())
		this.backimage2 = this.add.sprite(width / 2 + width, height / 2, 'sky' + this.selectRandomBackground())
		// foreground
		this.bgimage = this.add.sprite(width / 2, height / 2, 'fore' + this.selectRandomForeground())
		this.bgimage2 = this.add.sprite(width / 2 + width, height / 2,'fore' + this.selectRandomForeground())
		// grass

		this.grass = this.add.sprite(width / 2, height / 2, 'middleG')
		this.grass2 = this.add.sprite(width / 2 + width, height / 2,'middleG' )
		const character = new Character(this)
		character.setPosition(300, height / 2)
		this.character = character
		
		this.add.existing(character)
		
		this.input.on('pointerdown', () => {
			this.character.jump()
		})

		this.input.on('pointerup', () => {
			this.character.jumping = false
		})
		
		this.collectibles = []
		this.obstacles = []
		this.backgroundObjects = []
		
		const BackgroundSpawn = this.time.addEvent({
			delay: 4000,
			callback: () => {
				const object = new Background(this, -this.runningSpeed * 1.2)
				this.add.existing(object)
				this.backgroundObjects.push(object)
			},
			loop: true
		})
		
		this.runningSpeed = RUNNING_SPEED
		const speedtimer = this.time.addEvent({
			delay: 1000,
			callback: () => {
				this.updateSpeed()
			},
			loop: true
		})
		
		let difficulty = 0
		const obstacleSpawn = this.time.addEvent({
			delay: 4000,
			callback: () => {
				difficulty++
				this.spawnObstacle()
				if (difficulty > 10 && Math.random() > 0.5) {
					setTimeout(() => this.spawnObstacle(), 1000)
				}
			},
			loop: true
		})
		this.add.existing(scoreBackground)
		this.add.existing(scoreText)
		
		this.track = this.sound.add('track2');
		this.track.play({
				loop: true
			});
		this.spawnObstacle()
		
		this.createCollectibleSpawnTimer()
		
		const soundControls = new SoundControls(this)
		soundControls.setPosition(width - 450, 50)
		this.add.existing(soundControls)
	}
	
	createCollectibleSpawnTimer() {
		this.collectibleSpawnTimer = this.time.addEvent({
			delay: Math.floor(
				Math.random() * (
					COLLECTIBLE_MAX_SPAWN_TIME
					- COLLECTIBLE_MIN_SPAWN_TIME
				)
				+ COLLECTIBLE_MIN_SPAWN_TIME
			),
			callback: () => {
				this.spawnCollectible()
				setTimeout(() => this.createCollectibleSpawnTimer(), 0)
			}
		})
		
	}
	
	updateSpeed () {
		this.runningSpeed++
		for (const obstacle of this.obstacles) {
			obstacle.speed = -this.runningSpeed
		}

		for (const collectible of this.collectibles) {
			collectible.speed = -this.runningSpeed
		}
	}
	
	spawnObstacle () {
		const obstacle = new Obstacle(this, -this.runningSpeed)
		this.add.existing(obstacle)
		this.obstacles.push(obstacle)
	}

	spawnCollectible () {
		const collectible = new Collectible(this, -this.runningSpeed)
		this.add.existing(collectible)
		this.collectibles.push(collectible)
	}
	
	selectRandomForeground () {
		const index = Math.floor(Math.random() * this.availableForegrounds.length)
		const foregroundId = this.availableForegrounds[index]
		this.availableForegrounds.splice(index, 1)
		this.usedForegrounds.push(foregroundId)
		return foregroundId
	}

	
	selectRandomBackground () {
		const index = Math.floor(Math.random() * this.availableBackgrounds.length)
		const backgroundId = this.availableBackgrounds[index]
		this.availableBackgrounds.splice(index, 1)
		this.usedBackgrounds.push(backgroundId)
		return backgroundId
	}
	
	resetBackground (background) {
		const { width } = this.sys.canvas
		
		if (background.x <= -width / 2) {
			background.x += width * 2
			const nextBackground = this.selectRandomBackground()
			this.availableBackgrounds.push(this.usedBackgrounds.shift())
			background.setTexture('sky' + nextBackground)
		}
	}
	resetForeground (foreground) {
		const { width } = this.sys.canvas
		
		if (foreground.x <= -width / 2) {
			foreground.x += width * 2
			const nextForeground = this.selectRandomForeground()
			this.availableForegrounds.push(this.usedForegrounds.shift())
			foreground.setTexture('fore' + nextForeground)
		}
	}

	resetGrass (grass) {
		const { width } = this.sys.canvas
		
		if (grass.x <= -width / 2) {
			grass.x += width * 2
			
		}
	}

	
	updateObjects (objects, deltaTime) {
		const despawnObjects = []
		
		for (const object of objects) {
			object.updatePosition(deltaTime)
			
			if (object.x < -object.width) {
				object.destroy()
				despawnObjects.push(object)
			}
		}
		
		for (const object of despawnObjects) {
			const index = objects.indexOf(object)
			
			if (index !== -1) {
				objects.splice(index, 1)
			}
		}
	}
	
	collect(collectible) {
		const index = this.collectibles.indexOf(collectible)
		
		if (index !== -1) {
			this.collectibles.splice(index, 1)
		}
		
		collectible.destroy()
		this.score+=200
	}

	update (time, deltaTime) {
		this.score+=1
		this.bgimage.x += -this.runningSpeed * deltaTime * 0.7 / 1000;
		this.bgimage2.x += -this.runningSpeed * deltaTime * 0.7 / 1000;
		this.grass.x += -this.runningSpeed * deltaTime / 1000;
		this.grass2.x += -this.runningSpeed * deltaTime / 1000;
		this.backimage.x += -this.runningSpeed * deltaTime * 0.5 / 1000;
		this.backimage2.x += -this.runningSpeed * deltaTime * 0.5 / 1000;
		this.resetGrass(this.grass)
		this.resetGrass(this.grass2)
		this.resetForeground(this.bgimage)
		this.resetForeground(this.bgimage2)
		this.resetBackground(this.backimage)
		this.resetBackground(this.backimage2)
		this.scoreText.text = this.score;
		
		this.character.updatePosition(deltaTime)
		
		this.updateObjects(this.obstacles, deltaTime)
		this.updateObjects(this.backgroundObjects, deltaTime)
		this.updateObjects(this.collectibles, deltaTime)
		
		let collisionDetected = false
		
		const characterWidth = this.character.getWidth()
		const characterHeight = this.character.getHeight()
		const characterX = this.character.getX()
		const characterY = this.character.getY()
		
		for (const obstacle of this.obstacles) {
			const dx = (characterX + characterWidth / 2) - (obstacle.x + obstacle.width / 2)
			const dy = characterY - obstacle.y
			const distance = dx * dx + dy * dy
			const minimumDistance = (characterWidth / 2 + obstacle.width / 2) * 0.7
			
			if (distance < minimumDistance * minimumDistance) {
				collisionDetected = true
			}
		}
		
		const collected = []

		for (const collectible of this.collectibles) {
			if (
				characterX + characterWidth * 3 / 4 > collectible.x + collectible.width / 3
				&& characterX + characterWidth / 4 < collectible.x + collectible.width * 2 / 3
				&& (
					(
						collectible.side === 0
						&& characterY - characterHeight < collectible.y
						&& characterY > collectible.y - collectible.height / 2
					)
					|| (
						collectible.side === 1
						&& characterY - characterHeight < collectible.y - COLLECTIBLE_OFFSET * 2
						&& characterY > collectible.y - collectible.height / 2 - COLLECTIBLE_OFFSET * 2
					)
				)
			) {
				collected.push(collectible)
			}
		}
		
		for (const collectible of collected) {
			this.collect(collectible)
		}
		
		if (collisionDetected) {
			this.character.footsteps.pause()
			this.track.pause()
			this.scene.start('GameOver')
			
		}
	}
}
