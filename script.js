'use strict'

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form')
const containerWorkouts = document.querySelector('.workouts')
const inputType = document.querySelector('.form__input--type')
const inputDistance = document.querySelector('.form__input--distance')
const inputDuration = document.querySelector('.form__input--duration')
const inputCadence = document.querySelector('.form__input--cadence')
const inputElevation = document.querySelector('.form__input--elevation')

class Workout {
  // public fields
  date = new Date()
  id = (Date.now() + '').slice(-10)

  constructor(coords, distance, duration) {
    this.coords = coords // [lat, long]
    this.distance = distance // in km
    this.duration = duration // in min
  }
}

class Running extends Workout {
  type = 'running'
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration)
    this.cadence = cadence
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance
  }
}

class Cycling extends Workout {
  type = 'cycling'
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration)
    this.elevationGain = elevationGain
  }

  calcSpeed() {
    // km/h
    this.speed = this.distance / (this.duration / 60)
  }
}

// const run = new Running([24, 45], 23, 45, 89)
// console.log(run)

// -----------------------------APPLICATION ARCHITECTURE---------------------------------------
class App {
  #map
  #mapEvent
  #workouts = []
  constructor() {
    this._getPosition()
    form.addEventListener('submit', this._newWorkout.bind(this))
    inputType.addEventListener('change', this._toggleElevationField)
  }

  _getPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () =>
        alert('Unable to detect your location')
      )
    }
  }

  _loadMap(position) {
    const { latitude } = position.coords
    const { longitude } = position.coords
    console.log(`https://www.google.com/maps/@${latitude}.${longitude}`)

    const coords = [latitude, longitude]
    this.#map = L.map('map').setView(coords, 14)
    //   console.log(map)

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map)

    this.#map.on('click', this._showForm.bind(this))
  }

  _showForm(mapE) {
    this.#mapEvent = mapE
    form.classList.remove('hidden')
    inputDistance.focus()
  }

  _toggleElevationField() {
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
  }

  _newWorkout(e) {
    const validInputs = (...inputs) => inputs.every(inp => Number.isFinite(inp))
    const allPositive = (...inputs) => inputs.every(inp => inp > 0)

    e.preventDefault()

    // Get data from Form
    const type = inputType.value
    const distance = +inputDistance.value
    const duration = +inputDuration.value
    const { lat, lng } = this.#mapEvent.latlng
    let workout

    // If wrokout running, create running object
    if (type === 'running') {
      // Check if data is valid
      const cadence = +inputCadence.value
      if (
        // !Number.isFinite(distance) ||
        // !Number.isFinite(cadence) ||
        // !Number.isFinite(duration)
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      ) {
        return alert('Inputs have to be positve numbers')
      }
      workout = new Running([lat, lng], distance, duration, cadence)
    }

    // If workout cycling, create cycling object
    if (type === 'cycling') {
      const elevation = +inputElevation.value

      if (
        !validInputs(distance, duration, elevation) ||
        !allPositive(distance, duration)
      ) {
        return alert('Inputs have to be positve numbers')
      }

      workout = new Cycling([lat, lng], distance, duration, elevation)
    }

    // Add new object to the workout array
    this.#workouts.push(workout)

    // Render workout on map
    this.renderWorkoutMarker(workout)

    // Render workout on list

    // Hide forms  + clear input fields
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        ''
  }

  renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 200,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent('Workout')
      .openPopup()
  }
}

const app = new App()
