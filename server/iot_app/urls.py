from django.urls import path
from . import views
from . import views_auth
from . import views_data
from . import views_device
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Test Endpoints
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
    
    # Data Endpoints
    path('data/dashboard/', views_data.DashboardDataView.as_view(), name='dashboard_data'),
    path('data/members/', views_data.MemberListView.as_view(), name='member_list'),
    path('data/members/<int:pk>/', views_data.MemberDetailView.as_view(), name='member_detail'),
    path('data/history/', views_data.HistoryListView.as_view(), name='history_list'),
    path('data/history/<int:pk>/', views_data.HistoryDetailView.as_view(), name='history_detail'),
    path('data/user-by-maid/<int:ma_id>/', views_data.UserByMaIDView.as_view(), name='user_by_maid'),
    path('data/notifications/', views_data.NotificationListView.as_view(), name='notification_list'),
    path('data/stats/environment/', views_data.StatisticsEnvView.as_view(), name='stats_env'),
    path('data/stats/activity/', views_data.StatisticsActivityView.as_view(), name='stats_activity'),
    path('data/stats/top-users/', views_data.StatisticsTopUsersView.as_view(), name='stats_top_users'),
    
    # Device Control & Data
    path('device/door/', views_device.DeviceDoorView.as_view(), name='device_door'),
    path('device/lcd/', views_device.DeviceLCDView.as_view(), name='device_lcd'),
    path('device/sensors/', views_device.DeviceSensorsView.as_view(), name='device_sensors'),
    path('device/camera/', views_device.DeviceCameraView.as_view(), name='device_camera'),
    path('device/rfid/', views_device.DeviceRFIDView.as_view(), name='device_rfid'),
]
