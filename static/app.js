const mainContainer = document.querySelector('.main-container')
const chatAppContainer = document.querySelector('.chat-application-container')
const dropDown = document.querySelector('.dropdown')			// logout modal

const textInput = document.querySelector('.message-input')
const postContainer = document.getElementById('posts-container')
const posts = document.querySelector('.posts')
const loadingSpinner = document.querySelector('.loading-spinner')
const popupDiv = document.querySelector('.slide-msg')

let username, socket
let hasMore = true
let pageNum = 1 ,paginateBy = 10
let isFirstFetch = true
let isFetching = false
const chatSocketURL = `ws://${window.location.host}/ws/chat`

function getCookie(name) {  // to generate a csrf token
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function renderMessage(data,append=true) {
	let div = document.createElement('div')
	div.classList.add('msg');
	let innerTags = `
			<span class="font-weight-bold d-block">${data.user}</span class="font-weight-bold">
			<span class="">${data.text}</span>`
	div.innerHTML  = innerTags
	if(append)
		postContainer.append(div)
	else
		postContainer.prepend(div)
	
}

function showNotifications(message,bg_color,timeOut){
	popupDiv.classList = ['slide-msg']
	popupDiv.innerText = message
    popupDiv.classList.add('show',bg_color)
    
	popupDiv.addEventListener('transitionend',(e)=>{
		setTimeout(()=>{
    		popupDiv.classList.remove('show')
	    	popupDiv.innerText = ''
		},timeOut)    
	})
}

// all socket functions
function setSocket(){
	socket = new WebSocket(chatSocketURL);

	socket.onopen = (e) =>{
		showNotifications(`Connection established, logged in as ${username}`,"light-green",3000)
	}

	socket.onclose = (e) =>{
		if(!e.wasClean)
			showNotifications(`Connection Lost.. Try refershing !`,"red",5000)
	}

	socket.onmessage = (e) =>{
		if(e.data){
			data = JSON.parse(e.data)
			if(data.isdone){
				renderMessage(data.data)
				posts.scrollTop = posts.scrollHeight
			}else
				showNotifications(data.message)
		} 
	}
}

async function sendMessage(event) {
	event.preventDefault()
	const message = {'text':textInput.value, "user":username}
	
	socket.send(JSON.stringify(message))

	textInput.value = ''
	// textInput.blur()
}

// fetch messages from server (previous messages are also fetched when the user us scrolled to top)
async function getMessage(){
	const csrftoken = getCookie('csrftoken')
	let data = {"page_num":pageNum , "paginate_by":paginateBy}

	try{
		toggleLoadingSpinner(true)
		isFetching = true
		let response = await fetch('/getmessage',{
			method:"POST",
			body:JSON.stringify(data),
			headers: {'X-CSRFToken': csrftoken }
		})
		let responseData = await response.json()
		console.log(responseData)
		if (responseData.has_more)
			pageNum = responseData.next_page
		hasMore = responseData.has_more

		// if this is the first time fetching messages append it else prepand it
		if(isFirstFetch){
			for(let message of responseData.data)
				renderMessage(message)
			isFirstFetch = false
			posts.scrollTop = posts.scrollHeight
		}else{
			for(let message of responseData.data.reverse())
				renderMessage(message,false)
			posts.scrollTop = posts.scrollTop + (10*16)  // after loading slightly scroll down
		}

		toggleLoadingSpinner(false)
		isFetching = false
	}catch(err){
		console.error("something went wrong !!",err)
	}
}

// Utility Functions
function toggleLoadingSpinner(show){
	if(show)
		loadingSpinner.classList.replace('d-none','d-flex')
	else
		loadingSpinner.classList.replace('d-flex','d-none')
}

function toggleLogoutModal(){
	dropDown.classList.toggle('show-dropdown')
}

posts.onscroll = (e) =>{
	if(event.target.scrollTop == 0){
		console.log('Scrolled to Top')
		if(hasMore && !isFetching)
			getMessage()
	}
}

// the below function are just to handle the user related tasks, such as 
// getting username and saving it
// or removing user 
// and showing appropriate div's because everything is handled in single page

function setUserName(event=null){
	if (event)
		event.preventDefault()
	const inputField = document.querySelector('.name-input')
	username = inputField.value
	if(username){
		localStorage.setItem('username',username)
		inputField.value = ''
		chatAppContainer.style.display = 'none'
		mainContainer.classList.remove('show-main-container')
		startingPoint()
	}
}

function logoutUser(){
	toggleLogoutModal()
	localStorage.removeItem('username')
	postContainer.innerHTML = ''
	chatAppContainer.style.display = 'none'
	socket.close()
	socket = null
	isFirstFetch = true
	pageNum = 1
	showNotifications(`logged out succesful`,'light-green',2000)
	startingPoint()
}

function startingPoint(){
	let temp = localStorage.getItem('username')
	if(temp){
		username = temp
		chatAppContainer.style.display = 'flex'
		setSocket()
		getMessage()
	}
	else{
		mainContainer.classList.add('show-main-container')
	}
}


startingPoint()