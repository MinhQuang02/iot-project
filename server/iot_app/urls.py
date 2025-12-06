from django.urls import path
from . import views

urlpatterns = [
    path('test/health/', views.test_health, name='test_health'),
    path('test/data/', views.test_data, name='test_data'),
    path('test/create/', views.test_create, name='test_create'),
]
