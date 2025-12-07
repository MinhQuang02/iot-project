from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from django.conf import settings
from django.core.mail import send_mail
from .serializers import LoginSerializer, RegisterSerializer, GoogleLoginSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
from .supabase_client import get_supabase_client
import requests
import uuid

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(APIView):
    permission_classes = [] 

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            email = serializer.validated_data['email']
            password = serializer.validated_data['password']
            first_name = serializer.validated_data.get('first_name', '')
            last_name = serializer.validated_data.get('last_name', '')

            supabase = get_supabase_client()
            
            try:
                res = supabase.table('NGUOI_DUNG').select('MaND').eq('Username', username).execute()
                if res.data:
                    return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
                
                res = supabase.table('NGUOI_DUNG').select('MaND').eq('Email', email).execute()
                if res.data:
                    return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)

                hashed_pw = make_password(password)

                user_data = {
                    'Username': username,
                    'Email': email,
                    'MatKhau': hashed_pw,
                    'HoND': last_name,
                    'TenND': first_name,
                    'QuyenHan': 'member'
                }
                
                data_res = supabase.table('NGUOI_DUNG').insert(user_data).execute()
                
                if not data_res.data:
                     return Response({'error': 'Failed to create user in Supabase'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                django_user, created = User.objects.get_or_create(username=username)
                if created:
                    django_user.email = email
                    django_user.set_password(password)
                    django_user.save()
                    
                    # Send Welcome Email
                    try:
                        send_mail(
                            subject='Welcome to GreenSphere!',
                            message=f'Hi {first_name},\n\nWelcome to GreenSphere! Your account has been successfully created.\n\nUsername: {username}\n\nHappy Gardening!',
                            from_email=settings.EMAIL_HOST_USER,
                            recipient_list=[email],
                            fail_silently=True,
                        )
                    except Exception as e:
                        print(f"Failed to send welcome email: {e}")

                tokens = get_tokens_for_user(django_user)
                return Response({
                    'message': 'User registered successfully',
                    'user': data_res.data[0],
                    'tokens': tokens
                }, status=status.HTTP_201_CREATED)

            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data.get('username')
            email = serializer.validated_data.get('email')
            password = serializer.validated_data['password']

            if not username and not email:
                return Response({'error': 'Username or Email is required'}, status=status.HTTP_400_BAD_REQUEST)

            supabase = get_supabase_client()

            try:
                if username:
                    res = supabase.table('NGUOI_DUNG').select('*').eq('Username', username).execute()
                else:
                    res = supabase.table('NGUOI_DUNG').select('*').eq('Email', email).execute()

                if not res.data:
                    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
                
                user_record = res.data[0]
                db_password = user_record['MatKhau']

                if not check_password(password, db_password):
                     return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
                
                django_username = user_record['Username']
                django_user, created = User.objects.get_or_create(username=django_username)
                if created:
                    django_user.email = user_record['Email']
                    django_user.set_password(password)
                    django_user.save()
                
                tokens = get_tokens_for_user(django_user)
                
                return Response({
                    'message': 'Login successful',
                    'user': user_record,
                    'tokens': tokens
                }, status=status.HTTP_200_OK)

            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class GoogleLoginView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = GoogleLoginSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            
            google_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
            google_response = requests.get(google_url)
            
            if google_response.status_code != 200:
                return Response({'error': 'Invalid Google Token'}, status=status.HTTP_400_BAD_REQUEST)
            
            google_data = google_response.json()
            email = google_data.get('email')
            email_verified = google_data.get('email_verified')
            name = google_data.get('name', '')
            
            if not email_verified:
                return Response({'error': 'Email not verified by Google'}, status=status.HTTP_400_BAD_REQUEST)
            
            supabase = get_supabase_client()
            
            try:
                res = supabase.table('NGUOI_DUNG').select('*').eq('Email', email).execute()
                
                user_record = None
                
                if res.data:
                    user_record = res.data[0]
                else:
                    random_pw = str(uuid.uuid4())
                    hashed_pw = make_password(random_pw)
                    
                    parts = name.split(' ')
                    first_name = parts[0]
                    last_name = ' '.join(parts[1:]) if len(parts) > 1 else ''
                    
                    user_data = {
                        'Username': email.split('@')[0], 
                        'Email': email,
                        'MatKhau': hashed_pw,
                        'HoND': last_name,
                        'TenND': first_name,
                        'QuyenHan': 'member'
                    }
                    
                    create_res = supabase.table('NGUOI_DUNG').insert(user_data).execute()
                    if create_res.data:
                        user_record = create_res.data[0]
                    else:
                        return Response({'error': 'Failed to create Google user'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                django_username = user_record['Username']
                django_user, created = User.objects.get_or_create(username=django_username)
                if created:
                    django_user.email = email
                    django_user.set_password(str(uuid.uuid4()))
                    django_user.save()

                tokens = get_tokens_for_user(django_user)
                return Response({
                    'message': 'Google Login successful',
                    'user': user_record,
                    'tokens': tokens
                }, status=status.HTTP_200_OK)

            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            supabase = get_supabase_client()
            
            try:
                res = supabase.table('NGUOI_DUNG').select('Username').eq('Email', email).execute()
                if not res.data:
                    return Response({'message': 'If the email exists, a reset link has been sent.'}, status=status.HTTP_200_OK)
                
                refresh = RefreshToken()
                refresh['email'] = email
                refresh['type'] = 'reset_password'
                token = str(refresh.access_token)
                
                reset_link = f"http://localhost:5173/reset-password?token={token}"
                
                send_mail(
                    subject='Password Reset Request',
                    message=f'Click the link to reset your password: {reset_link}',
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email],
                    fail_silently=False,
                )
                
                return Response({'message': 'Password reset link sent.'}, status=status.HTTP_200_OK)

            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ResetPasswordView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            
            from rest_framework_simplejwt.tokens import AccessToken
            try:
                access_token = AccessToken(token)
                if access_token.get('type') != 'reset_password':
                     return Response({'error': 'Invalid token type'}, status=status.HTTP_400_BAD_REQUEST)
                email = access_token.get('email')
                
                hashed_pw = make_password(new_password)
                supabase = get_supabase_client()
                
                update_res = supabase.table('NGUOI_DUNG').update({'MatKhau': hashed_pw}).eq('Email', email).execute()
                
                if update_res.data:
                    try:
                        u = User.objects.get(email=email)
                        u.set_password(new_password)
                        u.save()
                    except User.DoesNotExist:
                        pass
                        
                    return Response({'message': 'Password reset successful'}, status=status.HTTP_200_OK)
                else:
                     return Response({'error': 'Failed to update password'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            except Exception as e:
                return Response({'error': 'Invalid or expired token', 'details': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserDetailView(APIView):
    def get(self, request):
        user = request.user
        supabase = get_supabase_client()
        
        try:
            res = supabase.table('NGUOI_DUNG').select('*').eq('Username', user.username).execute()
            if res.data:
                return Response(res.data[0])
            else:
                return Response({'error': 'User not found in database'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
