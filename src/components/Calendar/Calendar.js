import React, { Component } from 'react'
import {Card, CardActions, CardHeader, CardText} from 'material-ui/Card'
import FloatingActionButton from 'material-ui/FloatingActionButton'
import RaisedButton from 'material-ui/RaisedButton'
import CancelButton from 'material-ui/svg-icons/content/clear'
import StartButton from 'material-ui/svg-icons/action/done'
import TimerIcon from 'material-ui/svg-icons/av/forward-10'
import { DateTime } from 'luxon'
import classnames from 'classnames'

import './styles.scss'

class Calendar extends Component {
  state = {
    currentEvent: null,
    nextEvent: null
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.events && nextProps.events.length) {
      const event = nextProps.events[0]
      const diffDate = DateTime.fromISO(event.start.dateTime).diffNow('seconds').toObject()
      
      if (diffDate && diffDate.seconds && diffDate.seconds < 5) {
        this.setState({
          currentEvent: event,
          nextEvent: nextProps.events[1]
        })
      } else {
        this.setState({
          currentEvent: null,
          nextEvent: event
        })
      }
    } else if (nextProps.events && !nextProps.events.length) {
      this.setState({
        currentEvent: null,
        nextEvent: null
      })
    }
  }

  /** Available status: 
    Vacant (nobody there, no booking)
    Occupied (Meeting booked and someone said starter)
    Booked (Meeting booked but nobody clicked started)
    Late (Meeting is on and overflowed the current time) -> Mark II
  **/
  getCurrentContent = () => {
    let { currentEvent } = this.state
    let startDate
    let endDate
    let started
    let stopped

    if (currentEvent) {
      startDate = DateTime.fromISO(currentEvent.start.dateTime).toFormat('HH:mm')
      endDate = DateTime.fromISO(currentEvent.end.dateTime).toFormat('HH:mm')

      if (currentEvent.extendedProperties) {
        if (currentEvent.extendedProperties.private) {
          started = currentEvent.extendedProperties.private.started === "true"
          stopped = currentEvent.extendedProperties.private.stopped === "true"
        }
      }
    }

    if (stopped) {
      currentEvent = null
    }

    const classStatus = currentEvent ? (started ? 'occupied' : 'booked') : 'vacant'

    return (
      <Card className={classnames('status', classStatus)}>
        <CardHeader title={this.props.calendar}/>
        <CardText>
          {currentEvent
            ? <div style={styles.currentContent}>
              <div style={styles.currentStatus}>
                {started ? 'Occupied' : 'Booked'}
              </div>
              <div style={styles.currentInfo}>
                <div style={styles.currentEventTitle}>
                  {currentEvent.summary}
                </div>
                <div style={styles.currentDateTime}>
                  {`${startDate} - ${endDate}`}
                </div>
              </div>
            </div>
            : <div style={styles.currentContent}>
              <div style={styles.currentStatus}>Free</div>
            </div>
          }
        </CardText>
        {currentEvent &&
          <CardActions style={styles.actionButtons}>
            <FloatingActionButton style={styles.actionButton} disabled={this.props.loading}>
              {started
                ? <CancelButton onClick={() => this.props.makeStop(currentEvent)} />
                : <StartButton onClick={() => this.makeStart(currentEvent)} />
              }
            </FloatingActionButton>
          </CardActions>
        }
      </Card>
    )
  }

  getNextContent = () => {
    const { nextEvent } = this.state
    let startDate
    let endDate

    if (nextEvent) {
      startDate = DateTime.fromISO(nextEvent.start.dateTime).toFormat('HH:mm')
      endDate = DateTime.fromISO(nextEvent.end.dateTime).toFormat('HH:mm')
    }

    return (
      <Card style={styles.next}>
        <CardHeader
          title={nextEvent ? nextEvent.summary : 'No more events today'}
          subtitle={nextEvent ? nextEvent.creator.email : ''}
          titleColor={'#fff'}
          subtitleColor={'#999'}
        />
        <CardText style={{color:'#fff'}}>
          {nextEvent &&
            <div style={styles.nextDateTime}>
              {`${startDate} - ${endDate}`}
            </div>
          }
        </CardText>
        <CardActions style={styles.actionButtons}>
          {nextEvent &&
            <FloatingActionButton style={styles.actionButton} disabled={this.props.loading}>
              <StartButton onClick={() => this.makeStart(nextEvent, true)} />
            </FloatingActionButton>
          }
        </CardActions>
      </Card>
    )
  }

  getPanelContent = () => {
    return (
      <Card style={styles.sideMenu}>
        <div style={styles.avatar}>
          <img src='assets/images/cloudoki_pb_trim.png' style={{maxWidth: '100%', opacity: '.8'}}/>
        </div>
        <CardActions style={styles.actionButtons}>
          <RaisedButton
            children={<div style={{color: '#fff', padding: 20, fontSize: 20, textAlign: 'left'}}>
              <div style={{position: 'absolute', right: 20}}>
                <TimerIcon style={{height: 50, width: 50, color: '#fff'}}/>
              </div>
              <div>Quick</div>
              <div>Booking</div>
            </div>}
            primary
            fullWidth
            style={{height: 90}}
            onClick={() => this.createQuickEvent()}
          />
        </CardActions>
      </Card>
    )
  }

  makeStart = (event, updateTime) => {
    let stopped
    const { currentEvent } = this.state

    if (currentEvent && currentEvent.extendedProperties) {
      if (currentEvent.extendedProperties.private) {
        stopped = currentEvent.extendedProperties.private.stopped === "true"
      }
    }

    if (updateTime) {
      if (currentEvent && !stopped) {
        console.log("event is still ongoing")
        return
      }
    }
    this.props.makeStart(event, updateTime)
  }

  createQuickEvent = () => {
    const { currentEvent, nextEvent } = this.state
    let stopped

    if (currentEvent && currentEvent.extendedProperties) {
      if (currentEvent.extendedProperties.private) {
        stopped = currentEvent.extendedProperties.private.stopped === "true"
      }
    }

    if (currentEvent && !stopped) {
      console.log("Event is running")
      return
    } else if (nextEvent) {
      const diffDate = DateTime.fromISO(nextEvent.start.dateTime).diffNow('minutes').toObject()

      if (diffDate.minutes < 10) {
        console.log("not enough time")
        return
      }
    }
    this.props.createQuickEvent()
  }

  render () {
    return (
      <div style={styles.container}>
        <div style={styles.calendarContent}>
          {/* Current */}
          {this.getCurrentContent()}
          {/* Next */}
          {this.getNextContent()}
        </div>
        {/* Panel */}
        {this.getPanelContent()}
      </div>
    )
  }
}

const styles = {
  container: {
    padding: 20,
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    width: '100%'
  },
  calendarContent: {
    flex: 3,
    flexGrow: 3,
    display: 'flex',
    flexDirection: 'column'
  },
  sideMenu: {
    flex: '0 1 250px',
    marginLeft: 20,
    position: 'relative',
    textAlign: 'center'
    // flexShrink: '200px'
  },
  currentStatus: {
    fontSize: 110
  },
  currentInfo: {
    color: '#999',
    position: 'absolute',
    width: '100%',
    textAlign: 'left',
    bottom: 0,
    right: 0,
    padding: '35px 35px 35px 20px'
  },
  next: {
    flex: 1,
    flexGrow: 0,
    flexBasis: '120px',
    marginTop: 20,
    position: 'relative',
    backgroundColor: '#343434'
  },
  actionButtons: {
    position: 'absolute',
    width: '100%',
    textAlign: 'right',
    bottom: 0,
    right: 0,
    padding: 35
  },
  actionButton: {
    textAlign: 'center',
    marginLeft: 15
  },
  vacant: {

  },
  avatar: {
    textAlign: 'center',
    padding: '30px 50px'
  }
}

Calendar.propTypes = {}

export default Calendar
