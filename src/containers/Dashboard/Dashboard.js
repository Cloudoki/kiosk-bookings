import React, { Component } from 'react'
import { object } from 'prop-types'
import { googleDiscoveryDocs, googleClientId, googleCalendarScopes, googleApiKey, googleCalendarId } from 'constants/global'
import Calendar from 'components/Calendar'
import { DateTime } from 'luxon'

class Dashboard extends Component {
  state = {
    showAuthButton: false,
    showSignOutButton: false,
    loading: false
  }
  componentWillMount () {
    
  }

  componentDidMount () {
    setTimeout(() => {
      this.handleClientLoad()
    }, 2000)

    this.authorizeButton = document.getElementById('authorize-button');
    this.signoutButton = document.getElementById('signout-button');
  }

  handleClientLoad = () => {
    console.log("hre")
    gapi.load('client:auth2', this.initClient);
  }

  handleAuthClick = () => {
    console.log("hre")
    gapi.auth2.getAuthInstance().signIn();
  }

  handleSignoutClick = () => {
    console.log("hre")
    gapi.auth2.getAuthInstance().signOut();
  }

  initClient = () => {
    console.log("init")
    gapi.client.init({
      discoveryDocs: googleDiscoveryDocs,
      clientId: googleClientId,
      scope: googleCalendarScopes,
      apiKey: googleApiKey
    }).then(() => { console.log("then")
      // Listen for sign-in state changes.
      window.gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus.bind(this));
      
      // Handle the initial sign-in state.
      this.updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
    }, (error) => {
      console.log("error", error)
    })
    .catch(error => {
      console.log("here")
    })
  }

  updateSigninStatus(isSignedIn) {
    console.log("status")
    if (isSignedIn) {
      this.setState({
        showAuthButton: false,
        showSignOutButton: true
      })
      this.getEvents()
    } else {
      this.setState({
        showAuthButton: true,
        showSignOutButton: false
      })
    }
  }

  getEvents = () => {
    let today = DateTime.fromJSDate(new Date()).toObject()
    today.hour = 23
    today.minute = 59
    today.second = 59
    const eod = DateTime.fromObject(today).toISO()

    this.makeLoading()

    return gapi.client.calendar.events.list({
      'calendarId': googleCalendarId,
      'timeMin': (new Date()).toISOString(),
      'timeMax': eod,
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 20,
      'orderBy': 'startTime'
    }).then((response) => {
      this.setState({
        events: response.result.items.filter(e => {
          if (e.extendedProperties && e.extendedProperties.private.stopped) {
            return false
          } else {
            return true
          }
        }),
        calendar: response.result.summary,
        loading: false
      })
    })
  }

  createQuickEvent = () => {
    const startDateTime = DateTime.fromJSDate(new Date()).minus({ minutes: 1 }).toISO()
    const endDateTime = DateTime.fromJSDate(new Date()).plus({ minutes: 10 }).toISO()
    
    this.makeLoading()

    return gapi.client.calendar.events.insert({
      'calendarId': googleCalendarId,
      'start': {dateTime: startDateTime},
      'end': {dateTime: endDateTime},
      'extendedProperties': {
        'private': { 'started': true}
      }
    }).then((response) => {
      this.getEvents()
    },(error) => {console.log(error)})
  }

  makeStart = (event, updateTime) => {
    const startDateTime = (new Date()).toISOString()

    this.makeLoading()

    return gapi.client.calendar.events.patch({
      'calendarId': googleCalendarId,
      'eventId': event.id,
      'start': updateTime ? {dateTime: startDateTime} : event.start,
      'extendedProperties': {
        'private': { 'started': true}
      }
    }).then((response) => {
      console.log(response)
      this.getEvents()
    },(error) => {console.log(error)})
  }

  makeStop = (event) => {
    this.makeLoading()

    return gapi.client.calendar.events.patch({
      'calendarId': googleCalendarId,
      'eventId': event.id,
      'extendedProperties': {
        'private': { 'stopped': true}
      }
    }).then((response) => {
      this.getEvents()
    },(error) => {console.log(error)})
  }

  makeLoading = () => {
    this.setState({
      loading: true
    })
  }

  render () {
    let authButton = <button id="authorize-button" onClick={this.handleAuthClick.bind(this)}>Authorize</button>
    let signOutButton = <button id="signout-button" onClick={this.handleSignoutClick.bind(this)}>Sign Out</button>
    const { events, calendar, loading } = this.state
    const { classes } = this.props
    return(
      <div style={styles.container}>
        {this.state.showAuthButton ? authButton : null}
        {this.state.showSignOutButton &&
          <Calendar
            events={events}
            calendar={calendar}
            makeStart={this.makeStart}
            makeStop={this.makeStop}
            createQuickEvent={this.createQuickEvent}
            loading={loading}
          />
        }
      </div>
    )
  }
}

const styles = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5'
  }
}

Dashboard.propTypes = {
  /**
   * JSS classes
   */
  classes: object.isRequired,
  /**
   * JSS Theme
   */
  theme: object.isRequired,
  /**
   * Browser history session
   */
  history: object.isRequired
}

export default Dashboard
