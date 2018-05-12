import React, { Component } from 'react'
import { object } from 'prop-types'

import routes from './routes'

class App extends Component {
  render () {
    return [
      routes()
    ]
  }
}

App.propTypes = {
  location: object.isRequired
}

export default App
