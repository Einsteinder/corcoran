import React, { Component } from 'react';
import { compose, withProps } from "recompose";
import axios from 'axios'
import {
  withScriptjs,
  withGoogleMap,
  GoogleMap,
  Marker
} from "react-google-maps";
import './App.css';
require('dotenv').config()

const MyMapComponent = compose(
  withProps({
    /**
     * Note: create and replace your own key in the Google console.
     * https://console.developers.google.com/apis/dashboard
     * The key "AIzaSyBkNaAGLEVq0YLQMi-PYEMabFeREadYe1Q" can be ONLY used in this sandbox (no forked).
     */
    googleMapURL:
      `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_MAPAPI}`,
    loadingElement: <div style={{ height: `100%` }} />,
    containerElement: <div style={{ height: `400px`,width:`400px` }} />,
    mapElement: <div style={{ height: `100%` }} />
  }),
  withScriptjs,
  withGoogleMap
)(props => (
  <GoogleMap defaultZoom={14} defaultCenter={{ lat: 40.764, lng: -73.970 }}>
    {props.isMarkerShown && (props.data.map(d =>
      <Marker key = {d.Listing.ID} position={d.position} onClick={() => props.onMarkerClick(d.Listing.ID)}/>
    )
     
    )}
  </GoogleMap>
));
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      message: "Initial message",
      data: []
    };
    this.update = this.update.bind(this);


  }

   componentDidMount() {
    fetch(`${process.env.REACT_APP_DATAAPI}`)
      .then(function(response) {
        return response.json();
      })
      .then(function(myJson) {

        myJson.forEach(async function(obj){
          obj.position = await this.getGeo(obj.Property.Address.StreetNumber,obj.Property.Address.StreetName,obj.Property.Address.City)
          obj.highLight = false
        }.bind(this))
        this.setState({
          data: myJson
        })
      }.bind(this));

  }
  compare(a, b) {
    if (a.Date < b.Date)
      return -1;
    if (a.Date > b.Date)
      return 1;
    return 0;
  }
  update(id){
    let newState = this.state.data.map((obj)=>{
      obj.Listing.ID === id ? obj.highLight = true:obj.highLight =false
      return obj
    })

    this.setState({data:newState})
    
  }
  dateFormat(a) {
    var day
    var monthMap = {
      '01': 'Jan.',
      '02': 'Feb.',
      '03': 'Mar.',
      '04': 'Apr.',
      '05': 'May.',
      '06': 'Jun.',
      '07': 'Jul.',
      '08': 'Aug.',
      '09': 'Sep.',
      '10': 'Oct.',
      '11': 'Nov',
      '12': 'Dec.'
    }
    if (a.charAt(1) === '1') {
      day = a.substring(0, 2) + 'st'
    } else if (a.charAt(1) === '2') {
      day = a.substring(0, 2) + 'nd'
    } else if (a.charAt(1) === '3') {
      day = a.substring(0, 2) + 'rd'
    } else {
      day = a.substring(0, 2) + 'th'
    }
    var month = monthMap[a.substring(3, 5)]
    return month + " " + day
  }
  async getGeo(number,name,city){
    let geoObj = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${number}+${name.replace(" ","+")},+${city.replace(" ","+")}&key=${process.env.REACT_APP_GEOAPI}`)
    return geoObj.data.results[0].geometry.location
  }
  timeFormat(time) {
    var hoursString = time.split(':')[0]
    var hours = Number(time.split(':')[0])
    var suffix = (hours >= 12) ? 'pm' : 'am';

    hours = (hours > 12) ? Number(hours) - 12 : hours;

    hours = (hoursString === '00') ? 12 : hours;
    return hours.toString() + ":" + time.split(':')[1] + " " + suffix.toUpperCase()
  }
  processPrice(price) {
    price = price.toString()
    var count = 0
    var res = ""
    for (var x = price.length - 1; x > -1; x--) {
      if (count === 3) {
        count = 0
        res = price[x] + "," + res
      } else {
        res = price[x] + res
      }
      count += 1
    }
    return res
  }
  render(){
    return (<div> {
      this.state.data.map(d => {
        d.Listing.OpenHouses.sort(this.compare)
        return ( <li key ={d.Listing.ID}  className = {"selected" + (d.highLight?"true":"false")}> <div> {
            d.Property.Address.StreetNumber
          } {
            d.Property.Address.StreetName
          } < span style = {{float: 'right'}} > $ {this.processPrice(d.Listing.Price)
          } {
            d.Listing.Transaction === "Rent" ? " per month" : ""
          } </span> </div>
          <div> {
            d.Listing.Transaction
          } </div> <div> Open House: {
            this.dateFormat(d.Listing.OpenHouses[0].Date)
          } - {
            this.timeFormat(d.Listing.OpenHouses[0].StartTime)
          } to {
            this.timeFormat(d.Listing.OpenHouses[0].EndTime)
          } </div> </li>
        )
      })
      }
    
      <MyMapComponent isMarkerShown data ={this.state.data} onMarkerClick={this.update} /> 
      </div>)
  }
}

export default App;
