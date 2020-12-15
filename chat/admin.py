from django.contrib import admin

from .models import Message
# Register your models here.

class MessageAdmin(admin.ModelAdmin):
    model = Message
    list_per_page = 50
    ordering = ['-timestamp']
    # search_fields = ['user']

admin.site.register(Message,MessageAdmin)
