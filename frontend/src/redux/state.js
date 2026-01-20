let rerenderEntireTree = () => {
    console.log("state is changed!")
}
let state = {
    profilePage: {
        user: {
            email: "",
            full_name: "",
            channel_id: "",
            password: ""
        },
        newPostText: 'Hi from Flower!'
    },
    messagesPage: {
        messages: [
            {id: 1, message: 'hi there!'},
            {id: 2, message: 'how are you?!'},
            {id: 2, message: 'great thanks!'},
            {id: 3, message: 'how about education?'},
            {id: 4, message: 'surviving:) what about yours?'},
            {id: 4, message: 'also good!'}
        ],
        dialogs: [
            {id: 1, name: 'Tommy', avatar: 'https://static.vecteezy.com/system/resources/thumbnails/001/503/756/small/boy-face-avatar-cartoon-free-vector.jpg'},
            {id: 2, name: 'Sara', avatar: 'https://image.freepik.com/free-vector/smiling-girl-avatar_102172-32.jpg'},
            {id: 2, name: 'Maisie', avatar: 'https://t4.ftcdn.net/jpg/02/78/70/99/360_F_278709964_PhS3MsOE9udVYb5VCin1xCQJlm3HFb9V.jpg'},
            {id: 3, name: 'Sam', avatar: 'https://thumbs.dreamstime.com/b/cute-boy-face-cartoon-cute-boy-face-cartoon-vector-illustration-graphic-design-110656271.jpg'},
            {id: 4, name: 'Andrew', avatar: 'https://png.pngtree.com/png-clipart/20201225/ourlarge/pngtree-q-version-hand-drawn-cute-boy-handsome-avatar-png-image_2617578.jpg'},
            {id: 5, name: 'Thomas', avatar: 'https://png.pngtree.com/element_our/20190530/ourlarge/pngtree-cute-boy-couple-avatar-image_1235465.jpg'},
            {id: 6, name: 'Simon', avatar: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzgozLYV5Z9shkmpzedP9XU7klTHMKiq8tXA&usqp=CAU'},
            {id: 7, name: 'Tina', avatar: 'https://cdn.dribbble.com/users/1040983/screenshots/5578298/media/9386c308d2817a9721dec7bb1b4617d8.png?compress=1&resize=400x300'},
            {id: 8, name: 'Simpson', avatar: 'https://static1.cbrimages.com/wordpress/wp-content/uploads/2021/06/bart.jpg?q=50&fit=crop&w=963&h=481&dpr=1.5'},
            {id: 2, name: 'Maisie', avatar: 'https://t4.ftcdn.net/jpg/02/78/70/99/360_F_278709964_PhS3MsOE9udVYb5VCin1xCQJlm3HFb9V.jpg'},
        ],
        newDialogMessage: 'type...'
    },
}
export const addPost = () => {
    let newPost = {
        id: 5,
        title: state.profilePage.newPostText,
        likesCount: 5,
        dislikesCount: 1
    }
    state.profilePage.posts.push(newPost)
    state.profilePage.newPostText = '';
    rerenderEntireTree(state)
}
export let addMessage = () => {
    let newMessage = {
        id: 5,
        message: state.messagesPage.newDialogMessage
    }
    state.messagesPage.messages.push(newMessage)
    state.messagesPage.newDialogMessage = '';
    rerenderEntireTree(state)
}
export const updateNewPosText=(newText)=>{
    state.profilePage.newPostText = newText;
    rerenderEntireTree(state)
}

export const updateNewMessage=(newText)=>{
    state.messagesPage.newDialogMessage = newText;
    rerenderEntireTree(state)
}

export let subscriber = (observer) => {
    rerenderEntireTree = observer;
}

window.state = state;

export default state;
