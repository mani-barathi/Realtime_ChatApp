import json
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

from .models import Message
from .utils import serializeOneMessage

class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = 'room'
        self.room_group_name = 'chatroom1'

        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )

        self.accept()


    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )


    def receive(self, text_data):
        try:
            data = json.loads(text_data)
            print(data)
            
            new_message = Message(user=data["user"],text=data["text"])
            new_message.save()

            new_message_json = serializeOneMessage(new_message)
            response_data = { "data":new_message_json , "isdone":True, "message":"message added"}
        except:
            response_data = { "isdone":False ,"message":"something went wrong... Try refershing!" }

        # using group_send(), sends message to every User in the group 
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type':'sendMessage',     # event is sendMessage
                'message':response_data
            }
        )

    
    def sendMessage(self,event):   # handling the event sendMessage
        data = event['message']
        self.send(text_data=json.dumps(data))