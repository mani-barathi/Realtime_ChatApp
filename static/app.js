const mainContainer = document.querySelector('.main-container')
const chatAppContainer = document.querySelector('.chat-application-container')
const dropDown = document.querySelector('.dropdown')			// logout modal

const textInput = document.querySelector('.message-input')
const postContainer = document.getElementById('posts-container')
const posts = document.querySelector('.posts')
const loadingSpinner = document.querySelector('.loading-spinner')

const popupDiv = document.querySelector('.slide-msg')
const scrollDownBtn = document.querySelector('.scroll-down-btn')

let username, socket
let hasMore = true
let pageNum = 1 ,paginateBy = 15
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
	div.classList.add('msg')
	let innerTags
	if(data.user === username){
		innerTags = `
			<span class="font-weight-bold d-block "><u>${data.user}</u></span class="font-weight-bold">
			<span class="">${data.text}</span>`
	}else{
		innerTags = `
			<span class="font-weight-bold d-block">${data.user}</span class="font-weight-bold">
			<span class="">${data.text}</span>`
	}
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

// all socket events is intialized inside this function
function setSocket(){
	socket = new WebSocket(chatSocketURL);

	socket.onopen = (e) =>{
		showNotifications(`Connection established, logged in as ${username}`,"light-green",3000)
	}

	socket.onclose = (e) =>{
		if(!e.wasClean)		// connection is closed abruptly
			showNotifications(`Connection Lost.. Try refershing !`,"red",5000)
	}

	socket.onmessage = (e) =>{
		if(e.data){
			data = JSON.parse(e.data)
			if(data.isdone){
				const isAtBottom = ((posts.scrollHeight - posts.scrollTop) - (posts.offsetHeight)) <=(14*16)
				renderMessage(data.data)
				if(!isAtBottom){
					scrollDownBtn.classList.add('text-color-green')
				}else{
					posts.scrollTop = posts.scrollHeight	
				}
				
			}else
				showNotifications(data.message,'red',5000)
		} 
	}
}

async function sendMessage(event) {
	event.preventDefault()
	const message = {'text':textInput.value, "user":username}
	socket.send(JSON.stringify(message))			// sending message to socket
	textInput.value = ''
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
		if(responseData.is_done){
			// if there is more message to load, then update pageNum to next_page
			hasMore = responseData.has_more
			if (hasMore)		
				pageNum = responseData.next_page

			// if this is the first time fetching messages append it else prepand it
			if(isFirstFetch){
				for(let message of responseData.data)
					renderMessage(message)
				isFirstFetch = false
				posts.scrollTop = posts.scrollHeight
			}		// if this is a fetch for previous messages
			else{
				let previousHeight = posts.scrollHeight
				for(let message of responseData.data.reverse())
					renderMessage(message,false)
				let differenceHeight = posts.scrollHeight - previousHeight
				posts.scrollTop = differenceHeight - (7*16)
			}
		}else
			showNotifications("something went wrong !!",'red',5000)

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
	if(event.target.scrollTop == 0){			// at the top
		if(hasMore && !isFetching)
			getMessage()
	}else if((posts.scrollHeight - posts.scrollTop) == (posts.offsetHeight)){  // at bottom
		scrollDownBtn.classList.remove('text-color-green')
		scrollDownBtn.style.display ='none'
	}else{										// in between
		scrollDownBtn.style.display ='block'	
	}
}

function scrollToBottom(){   // hides the go to bottom btn
	scrollDownBtn.classList.remove('text-color-green')
	scrollDownBtn.style.display ='none'
	posts.scrollTop = posts.scrollHeight
}


function setUserName(event=null){
	if (event)
		event.preventDefault()
	const inputField = document.querySelector('.name-input')
	username = inputField.value.toLowerCase()
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
	showNotifications("You have been successfully logged out!",'light-green',3000)
	startingPoint()
}

function startingPoint(){
	let temp = localStorage.getItem('username')
	if(temp){		// if there is a username exists in localStorage show chatContainer
		username = temp
		chatAppContainer.style.display = 'flex'
		setSocket()
		getMessage()
	}
	else{			// if no name exists show mainContainer and ask for username
		mainContainer.classList.add('show-main-container')
	}
}


startingPoint()