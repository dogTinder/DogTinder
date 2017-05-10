import React from 'react';
import axios from 'axios';
import DisplayDog from './DisplayDog';
import Kennel from './Kennel.js';
import NavBar from './NavBar';
import Cookies from 'universal-cookie';
import uniqBy from 'lodash.uniqby';
import uniq from 'lodash.uniq';
import AddAnimalForm from './AddAnimalForm.js';
import FacebookLogin from './FacebookLogin.js';

const cookies = new Cookies();

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      index: 0,
      featuredDog: '',
      allDogs: '',
      animalList: []
    }
    this.nextDog = this.nextDog.bind(this);
    this.previousDog = this.previousDog.bind(this);
    this.saveDoggy = this.saveDoggy.bind(this);
    this.handleSearchQuery = this.handleSearchQuery.bind(this);
  }

  componentWillMount() {
    // if user has an animalList in their cookies

    axios.get('/dog-tinder-api/list')
    .then(response => {
      this.setState({animalList: response.data});
    })

    axios.get('/dog-tinder-api?location=07470') 
      .then(response => {
        console.log('componentwillmount response.data', response.data)
        return response.data;
      })
      .then(data => {
        this.setState({
          featuredDog: data[0],
          allDogs: data
        })
      })
      .catch(error => {
        console.error('Error on componentWillMount', error)
      });
  }
  
  nextDog() {
    let next = this.state.index + 1; 
    this.setState({
      featuredDog: this.state.allDogs[next],
      index: next
    });
  }

  previousDog() {
    let previous = this.state.index - 1;
    this.setState({
      featuredDog: this.state.allDogs[previous],
      index: previous
    });
  }


  saveDoggy(dog) { 
    console.log('SAVEDOGGY DOG', dog)
    let tempArray = this.state.animalList.slice();
    tempArray.push(dog);
    tempArray = uniqBy(tempArray, 'id.$t');
    let idArray = uniq(tempArray.map(function(item){return parseInt(item.id.$t)}));

    axios({
      method: 'post',
      url: '/dog-tinder-api/list', 
      data: idArray
    }).then(() => {
      this.setState({animalList: tempArray});
      cookies.set('animalList', JSON.stringify(idArray), { path: '/'});
    })
    .catch(() => {
      // this.setState({animalList: uniq(tempArray)});
      // cookies.set('animalList', JSON.stringify(idArray), { path: '/'});
      console.log("There was an error saving the list to the database")
    })
  }


  handleSearchQuery(theState) { 

    let data = {}; 
   
      data.location = theState.zipcode;
      if (theState.breed !== '') { data.breed = theState.breed; }
      if (theState.age !== '') { data.age = theState.age; }
      if (theState.sex !== '') { data.sex = theState.sex; }
 
    axios.get('/dog-tinder-api', { 
      params: data
    })
    .then(response => {
      let data = response.data
      this.setState({
        featuredDog: data[0],
        allDogs: data
      }) 
    }) 
    .catch(error => {
      console.log(error);
    });
  }
  
  
  render() {
    console.log(this.state.allDogs)
    var loginPrompt;
    if(cookies.get('loggedIn') === "true") {
      loginPrompt = <div>Welcome Back <a href="/logout">Logout?</a></div>
    } else {
      loginPrompt = <FacebookLogin />
    }

    return (
      <div>
        <h1 style={{fontSize:'50px'}}>Dog Tinder</h1>{loginPrompt}
       { this.state.allDogs != '' && <NavBar submitQuery={this.handleSearchQuery} dogs={this.state.allDogs}/>}
        {this.state.featuredDog !== '' ? <DisplayDog dog={this.state.featuredDog} dogs={this.state.allDogs} nextDog={this.nextDog} previousDog={this.previousDog} saveDoggy={this.saveDoggy} /> : <div></div>}
        <Kennel animalList={this.state.animalList}/>
      </div>
    );
  }
}



export default App;