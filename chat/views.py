from django.shortcuts import render
from django.http import HttpResponse,JsonResponse

from .models import Message
from .utils import serializeManyMessages
from json import loads
# Create your views here.

def index(request):
	return render(request,'chat/index.html',{})


def getMessage(request):
	request_data = loads(request.body)
	page_num = request_data['page_num'] if request_data['page_num'] else 1
	paginate_by = request_data['paginate_by'] if request_data['paginate_by'] else 10
	
	messages, has_more, next_page = Message.lastNMessages(page=page_num,paginate_by=paginate_by)
	serialized_messages = serializeManyMessages(messages)

	data = {
		"has_more":has_more,
		"data":serialized_messages[::-1],
		"is_done":True
	}

	if next_page is not False:
		data["next_page"] = next_page

	return JsonResponse(data)
