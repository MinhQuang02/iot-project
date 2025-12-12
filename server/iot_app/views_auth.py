from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from django.conf import settings
from django.core.mail import send_mail
from .serializers import LoginSerializer, RegisterSerializer, GoogleLoginSerializer, ForgotPasswordSerializer
from .supabase_client import get_supabase_client
import requests
import uuid
from validate_email_address import validate_email

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

            if not validate_email(email, verify=True):
                print("Email is not deliverable")
                return Response({'error': 'Email address does not exist or cannot receive mail.'}, status=status.HTTP_400_BAD_REQUEST)
            else:
                print("Email is deliverable")

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
                        html_content = f"""
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <style>
                                body {{
                                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                    line-height: 1.6;
                                    color: #333;
                                    background-color: #f4f4f4;
                                    margin: 0;
                                    padding: 0;
                                }}
                                .container {{
                                    max-width: 600px;
                                    margin: 20px auto;
                                    background-color: #ffffff;
                                    border-radius: 10px;
                                    overflow: hidden;
                                    box-shadow: 0 0 20px rgba(0,0,0,0.1);
                                }}
                                .header {{
                                    background: linear-gradient(135deg, #2ecc71, #27ae60);
                                    color: white;
                                    padding: 30px;
                                    text-align: center;
                                }}
                                .header h1 {{
                                    margin: 0;
                                    font-size: 28px;
                                    font-weight: 600;
                                }}
                                .content {{
                                    padding: 40px;
                                }}
                                .welcome-text {{
                                    font-size: 18px;
                                    margin-bottom: 30px;
                                    color: #2c3e50;
                                }}
                                .credentials-box {{
                                    background-color: #f8f9fa;
                                    border: 1px solid #e9ecef;
                                    border-radius: 8px;
                                    padding: 20px;
                                    margin: 25px 0;
                                    text-align: center;
                                }}
                                .credential-item {{
                                    margin: 10px 0;
                                    font-size: 16px;
                                }}
                                .label {{
                                    font-weight: bold;
                                    color: #7f8c8d;
                                    text-transform: uppercase;
                                    font-size: 12px;
                                    letter-spacing: 1px;
                                }}
                                .value {{
                                    color: #2c3e50;
                                    font-weight: 600;
                                    font-size: 18px;
                                    margin-left: 10px;
                                }}
                                .footer {{
                                    background-color: #2c3e50;
                                    color: #ecf0f1;
                                    text-align: center;
                                    padding: 20px;
                                    font-size: 14px;
                                }}
                                .btn {{
                                    display: inline-block;
                                    padding: 12px 30px;
                                    background-color: #27ae60;
                                    color: white;
                                    text-decoration: none;
                                    border-radius: 25px;
                                    font-weight: bold;
                                    margin-top: 20px;
                                    transition: background-color 0.3s;
                                }}
                                .btn:hover {{
                                    background-color: #219150;
                                }}
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <h1>Welcome to GreenSphere</h1>
                                    <p>Smart Greenhouse Solutions</p>
                                </div>
                                <div class="content">
                                    <p class="welcome-text">Hi {first_name},</p>
                                    <p>Thank you for joining GreenSphere! We are thrilled to have you on board!</p>
                                    
                                    <div class="credentials-box">
                                        <p style="margin-top: 0; color: #7f8c8d;">Here are your login credentials:</p>
                                        <div class="credential-item">
                                            <span class="label">Username</span><br>
                                            <span class="value">{username}</span>
                                        </div>
                                        <div class="credential-item">
                                            <span class="label">Password</span><br>
                                            <span class="value">{password}</span>
                                        </div>
                                    </div>

                                    <div style="text-align: center;">
                                        <a href="#" class="btn">Access Dashboard</a>
                                    </div>
                                    
                                    <p style="margin-top: 30px; font-size: 14px; color: #7f8c8d;">
                                        Please keep your credentials safe. If you have any questions, our support team is always here to help.
                                    </p>
                                </div>
                                <div class="footer">
                                    <p>&copy; 2024 GreenSphere. All rights reserved.</p>
                                    <p>Making the world greener, one greenhouse at a time.</p>
                                </div>
                            </div>
                        </body>
                        </html>
                        """

                        send_mail(
                            subject='Welcome to GreenSphere! Your Account Details',
                            message=f'Hi {first_name},\n\nWelcome to GreenSphere! Your account has been successfully created.\n\nUsername: {username}\nPassword: {password}\n\nHappy Gardening!',
                            from_email=settings.EMAIL_HOST_USER,
                            recipient_list=[email],
                            html_message=html_content,
                            fail_silently=False,
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
        # We manually check fields because serializer might still require username if not adjusted
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
             return Response({'error': 'Email and Password are required'}, status=status.HTTP_400_BAD_REQUEST)

        supabase = get_supabase_client()

        try:
            # Strictly authenticate by Email
            res = supabase.table('NGUOI_DUNG').select('*').eq('Email', email).execute()

            if not res.data:
                return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
            user_record = res.data[0]
            db_password = user_record['MatKhau']

            if not check_password(password, db_password):
                 return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
            django_username = user_record['Username']
            # Force sync local user with Supabase data to ensure no stale local state
            django_user, created = User.objects.update_or_create(
                username=django_username,
                defaults={
                    'email': user_record['Email'],
                    'first_name': user_record.get('TenND', ''),
                    'last_name': user_record.get('HoND', ''),
                }
            )
            if created:
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

class GoogleLoginView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = GoogleLoginSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            
            # Verify token with Google
            try:
                google_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={token}"
                google_response = requests.get(google_url)
                
                if google_response.status_code != 200:
                    return Response({'error': 'Invalid Google Token'}, status=status.HTTP_400_BAD_REQUEST)
                
                google_data = google_response.json()
                # extract Google data
                email = google_data.get('email')
                email_verified = google_data.get('email_verified')
                # Prefer given_name and family_name if available, else split 'name'
                g_given_name = google_data.get('given_name', '')
                g_family_name = google_data.get('family_name', '')
                full_name = google_data.get('name', '')
                
                if g_given_name:
                    first_name = g_given_name
                    last_name = g_family_name
                else:
                    # Fallback splitting
                    parts = full_name.split(' ')
                    if len(parts) > 1:
                        first_name = parts[0]
                        last_name = ' '.join(parts[1:])
                    else:
                        first_name = full_name
                        last_name = ''
                
                if not email_verified:
                    return Response({'error': 'Email not verified by Google'}, status=status.HTTP_400_BAD_REQUEST)
                
                supabase = get_supabase_client()
                
                # Check if user exists in Supabase
                res = supabase.table('NGUOI_DUNG').select('*').eq('Email', email).execute()
                
                user_record = None
                
                if res.data:
                    # EXISTING USER
                    user_record = res.data[0]
                    first_name = user_record.get('TenND', first_name)
                    last_name = user_record.get('HoND', last_name)
                    
                else:
                    # NEW USER
                    base_username = email.split('@')[0]
                    username = base_username
                    counter = 1
                    
                    # Loop to find unique username
                    while True:
                        check_user = supabase.table('NGUOI_DUNG').select('Username').eq('Username', username).execute()
                        if not check_user.data:
                            break
                        username = f"{base_username}{counter}"
                        counter += 1

                    # Generate random password for email
                    random_pw_raw = str(uuid.uuid4())[:8]
                    hashed_pw = make_password(random_pw_raw)

                    user_data = {
                        'Username': username, 
                        'Email': email,
                        'MatKhau': hashed_pw,
                        'HoND': last_name,
                        'TenND': first_name,
                        'QuyenHan': 'member'
                    }
                    
                    create_res = supabase.table('NGUOI_DUNG').insert(user_data).execute()
                    if create_res.data:
                        user_record = create_res.data[0]
                        
                        # Send Welcome Email with Password
                        try:
                            html_content = f"""
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <style>
                                    body {{ font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
                                    .container {{ max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }}
                                    .header {{ background: linear-gradient(135deg, #2ecc71, #27ae60); color: white; padding: 30px; text-align: center; }}
                                    .content {{ padding: 40px; }}
                                    .credentials-box {{ background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }}
                                    .value {{ color: #27ae60; font-size: 24px; font-weight: bold; letter-spacing: 2px; display: block; margin-top: 5px; }}
                                    .label {{ font-size: 12px; font-weight: bold; color: #7f8c8d; text-transform: uppercase; }}
                                    .footer {{ background: #2c3e50; color: #ecf0f1; text-align: center; padding: 20px; font-size: 14px; }}
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <div class="header">
                                        <h1 style="margin:0;">Welcome to GreenSphere</h1>
                                        <p style="margin:5px 0 0;">Google Login Success</p>
                                    </div>
                                    <div class="content">
                                        <p>Hi {first_name},</p>
                                        <p>Your account has been successfully created via Google. Here is your temporary password if you wish to login manually later:</p>
                                        <div class="credentials-box">
                                            <span class="label">Username</span><br>
                                            <span class="value" style="color: #34495e; font-size: 18px;">{username}</span><br><br>
                                            <span class="label">Password</span><br>
                                            <span class="value">{random_pw_raw}</span>
                                        </div>
                                    </div>
                                    <div class="footer">
                                        <p>&copy; 2024 GreenSphere. All rights reserved.</p>
                                    </div>
                                </div>
                            </body>
                            </html>
                            """
                            send_mail(
                                subject='Welcome to GreenSphere - Credentials',
                                message=f'Welcome! Your password is: {random_pw_raw}',
                                from_email=settings.EMAIL_HOST_USER,
                                recipient_list=[email],
                                html_message=html_content,
                                fail_silently=True,
                            )
                        except Exception as e:
                            print(f"Failed to send Google Welcome Email: {e}")

                    else:
                        return Response({'error': 'Failed to create Google user in database'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                # Sync with Django local User model for session/token management
                django_username = user_record['Username']
                django_user, created = User.objects.update_or_create(
                    username=django_username,
                    defaults={
                        'email': email,
                        'first_name': first_name,
                        'last_name': last_name,
                    }
                )
                
                if created:
                    django_user.set_password(str(uuid.uuid4()))
                    django_user.save()

                tokens = get_tokens_for_user(django_user)
                return Response({
                    'message': 'Google Login successful',
                    'user': user_record,
                    'tokens': tokens
                }, status=status.HTTP_200_OK)

            except Exception as e:
                return Response({'error': f"Internal Server Error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(APIView):
    permission_classes = []

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            supabase = get_supabase_client()
            
            try:
                res = supabase.table('NGUOI_DUNG').select('Username', 'TenND').eq('Email', email).execute()
                if not res.data:
                    return Response({'message': 'If the email exists, a new password has been sent.'}, status=status.HTTP_200_OK)
                
                user_record = res.data[0]
                username = user_record['Username']
                first_name = user_record.get('TenND', 'User')

                new_random_password = str(uuid.uuid4())[:8]
                hashed_pw = make_password(new_random_password)

                update_res = supabase.table('NGUOI_DUNG').update({'MatKhau': hashed_pw}).eq('Email', email).execute()
                
                if update_res.data:
                    # 4. Sync Local Django Users (Handle duplicates safely)
                    # Use filter() instead of get() to avoid "returned more than one User" error
                    local_users = User.objects.filter(email=email)
                    for u in local_users:
                        u.set_password(new_random_password)
                        u.save()
                    
                    # HTML Email Template
                    html_content = f"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body {{ font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
                            .container {{ max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1); }}
                            .header {{ background: linear-gradient(135deg, #e74c3c, #c0392b); color: white; padding: 30px; text-align: center; }}
                            .content {{ padding: 40px; }}
                            .credentials-box {{ background: #fff5f5; border: 1px solid #ffe3e3; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }}
                            .value {{ color: #c0392b; font-size: 24px; font-weight: bold; letter-spacing: 2px; display: block; margin-top: 5px; }}
                            .label {{ font-size: 12px; font-weight: bold; color: #7f8c8d; text-transform: uppercase; }}
                            .footer {{ background: #2c3e50; color: #ecf0f1; text-align: center; padding: 20px; font-size: 14px; }}
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1 style="margin:0;">Password Reset</h1>
                                <p style="margin:5px 0 0;">GreenSphere Security</p>
                            </div>
                            <div class="content">
                                <p>Hi {first_name},</p>
                                <p>We received a request to reset your password. Here is your new temporary password:</p>
                                <div class="credentials-box">
                                    <span class="label">New Password</span><br>
                                    <span class="value">{new_random_password}</span>
                                </div>
                                <p style="color: #7f8c8d; font-size: 14px;">Please log in and change this password immediately.</p>
                            </div>
                            <div class="footer">
                                <p>&copy; 2024 GreenSphere. All rights reserved.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                    """

                    send_mail(
                        subject='Security Alert: Your New Password',
                        message=f'Hi {first_name},\n\nYour new password is: {new_random_password}',
                        from_email=settings.EMAIL_HOST_USER,
                        recipient_list=[email],
                        html_message=html_content,
                        fail_silently=False,
                    )
                    
                    return Response({'message': 'A new password has been sent to your email.'}, status=status.HTTP_200_OK)
                else:
                    return Response({'error': 'Failed to update password'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
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
