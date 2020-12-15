from django.db import models
from django.core.paginator import Paginator

# Create your models here.
class Message(models.Model):
	user = models.CharField(max_length=50)
	text = models.TextField()
	timestamp = models.DateTimeField(auto_now_add=True)

	def __str__(self):
		return f"{self.user}'s message"

	def lastNMessages(page,paginate_by=10):
		messages = Message.objects.order_by('-timestamp').all()
		
		paginator = Paginator(messages,paginate_by)
		page_obj = paginator.page(page)
		paginated_messages = page_obj.object_list
		has_more = page_obj.has_next()
		
		if has_more:
			next_page = page_obj.next_page_number()
			return paginated_messages, has_more, next_page
		return paginated_messages, has_more, False

