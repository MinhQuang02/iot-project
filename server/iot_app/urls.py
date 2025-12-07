from django.urls import path
from . import views
from . import views_auth
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('test/health/', views.test_health, name='test_health'),
    path('test/data/', views.test_data, name='test_data'),
    path('test/create/', views.test_create, name='test_create'),
    
    # Auth Endpoints
    path('auth/register/', views_auth.RegisterView.as_view(), name='register'),
    path('auth/login/', views_auth.LoginView.as_view(), name='login'),
    path('auth/google/', views_auth.GoogleLoginView.as_view(), name='google_login'),
    path('auth/me/', views_auth.UserDetailView.as_view(), name='user_detail'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/forgot-password/', views_auth.ForgotPasswordView.as_view(), name='forgot_password'),
    path('auth/reset-password/', views_auth.ResetPasswordView.as_view(), name='reset_password'),
]
