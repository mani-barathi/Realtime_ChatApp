from django.urls import path
from .views import index, getMessage

urlpatterns = [
    path('',index,name="index"),
    path('getmessage',getMessage,name="getmessage"),
]
