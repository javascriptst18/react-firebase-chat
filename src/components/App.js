import React, { Component } from 'react';
import firebase, { googleProvider } from '../firebase';
import '../styles/normalize.css';
import '../styles/App.css';

class App extends Component {

  /**
   * State need to handle updating of input field,
   * list of all messages and the current logged in user
   * chatMessage is only used for <input> while messages
   * is used for fetching all chatmessages
   */
  state = {
    user: '',
    messages: [],
    chatMessage: '',
  }

  componentDidMount(){
    /**
     * Listen for changes in auth state and listen for
     * child added === message being pushed to database
     */
    this.auth();
    this.listenForMessages();
  }

  auth = () => {
    firebase.auth()
      .onAuthStateChanged(user => {
        /**
         * Firebase sends an user object if login is 
         * successful, otherwise we will recieve null,
         * if user is present, save it to state, otherwise
         * empty the state
         */
        if(user){
          this.setState({ user: user });
        } else {
          this.setState({ user: '' });
        }
      })
  }

  login = () => {
    /**
     * signInWithPopup is used for every third party
     * service, in this case we will only use google,
     * the provider object is created inside of
     * firebase.js
     */
    firebase.auth()
      .signInWithPopup(googleProvider)
  }

  logout = () => {
    /**
     * signOut is the only action that has to be called
     * the rest will be handled by the previously created
     * auth-listener
     */
    firebase.auth().signOut();
    this.setState({ messages: ''});
  }

  listenForMessages = () => {
    /**
     * Listen for every new child being added
     * on the path '/messages', every new object
     * that is pushed to the firebase database
     * will be sent to every listener and the callback
     * function will recieve an object containing
     * the pushed value, here I'm naming it 'snapshot'
     * because it is a snapshot of the current state
     * of the database
     */
    firebase
      .database()
      .ref('/messages')
      .on('child_added', (snapshot) => {
        /* For easier handling, save the value of the
         * snapshot in a new variable
         */
        const newMessage = snapshot.val();
        // Also extract the key if we want to use it later
        newMessage.key = snapshot.key;
        /**
         * Clone the previous state, make a copy while
         * simultaniouly adding the new message at either
         * the start of the array or at the end of the array,
         * 'messages' will include all previous messages
         * and the newly pushed snapshot
         */
        const messages = [newMessage, ...this.state.messages];
        //then save all messages to state
        this.setState({ messages: messages });
      })
  }

  // Used on the 'input' field
  onChange = (event) => {
    this.setState({ [event.target.name] : event.target.value });
  } 

  /**
   * onSubmit is bound to the form while onChange
   * is bound to the input field inside of the form
   */
  onSubmit = (event) => {
    event.preventDefault(); // prevent page from reload
    /**
     * Create a new message with the value of the
     * input-field, timestamp is the current time
     * as unix time. And the user is already in state
     * if we have logged in
     */
    const newMessage = {
      body: this.state.chatMessage,
      timestamp: new Date().getTime(),
      user: this.state.user.displayName
    }

    firebase
      .database()
      .ref('/messages')
      .push(newMessage);
    // Clear input field after submit
    this.setState({ chatMessage: '' });
  }

  /**
   * The loop inside of this function could be inside of
   * render but I prefer to extract it into a separate file
   * so render doesn't get cluttered. The timestamp has
   * to be converted to a date from timestamp and then
   * converted to a human readable format
   */
  renderChatMessages = (chatMessages) => {
    return chatMessages.map(message => (
      <div key={message.key}>
        <p>{ message.body}</p>
        <p>{ new Date(message.timestamp).toLocaleTimeString()} - {message.user }</p>
      </div>
    ));
  }

  render() {
    // Toggle between which button that is shown based on logged in state
    let userState = <button onClick={this.login}> Login </button>
    if(this.state.user){
      userState = <button onClick={this.logout}> Logout </button>
    } 
    return (
      <section>
        <nav>
          { userState }
          <form onSubmit={this.onSubmit}>
            <input 
              type="text"
              onChange={this.onChange}
              value={this.state.chatMessage}
              name="chatMessage"
              placeholder="Write something"
            />
            <button type="submit"> SEND </button>
          </form>
        </nav>
        {this.renderChatMessages(this.state.messages)}
      </section>
    );
  }
}

export default App;
