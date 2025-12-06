from django.urls import path
from . import views

urlpatterns = [
    path('latest/subscribed/', views.get_latest_subscribed, name='latest_subscribed'),
    path('latest/published/', views.get_latest_published, name='latest_published'),
]
