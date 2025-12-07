# from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
# from django.db import models

# # COMMENTED OUT TO AVOID CONFLICT WITH DEFAULT LOCAL USER MODEL
# # SINCE WE ARE USING REST API FOR SUPABASE AUTH

# class UserManager(BaseUserManager):
#     def create_user(self, username, email, password=None, **extra_fields):
#         if not email:
#             raise ValueError('The Email field must be set')
#         email = self.normalize_email(email)
#         user = self.model(username=username, email=email, **extra_fields)
#         user.set_password(password)
#         user.save(using=self._db)
#         return user

#     def create_superuser(self, username, email, password=None, **extra_fields):
#         extra_fields.setdefault('is_staff', True)
#         extra_fields.setdefault('is_superuser', True)
#         extra_fields.setdefault('QuyenHan', 'admin')
#         return self.create_user(username, email, password, **extra_fields)

# class User(AbstractBaseUser, PermissionsMixin):
#     MaND = models.AutoField(primary_key=True)
#     MaID = models.IntegerField(unique=True, null=True, blank=True)
#     HoND = models.CharField(max_length=100, null=True, blank=True)
#     TenND = models.CharField(max_length=100, null=True, blank=True)
#     username = models.CharField(max_length=100, unique=True, db_column='Username')
#     email = models.EmailField(unique=True, max_length=255, db_column='Email')
#     password = models.CharField(max_length=255, db_column='MatKhau') # Text in DB, but CharField fine
#     QuyenHan = models.CharField(
#         max_length=20, 
#         default='member', 
#         choices=[('admin', 'Admin'), ('member', 'Member')]
#     )
#     Created_At = models.DateTimeField(auto_now_add=True)
    
#     # Required for Django Admin/Auth
#     is_active = models.BooleanField(default=True)
#     is_staff = models.BooleanField(default=False)
    
#     objects = UserManager()

#     USERNAME_FIELD = 'username'
#     REQUIRED_FIELDS = ['email']

#     class Meta:
#         db_table = 'NGUOI_DUNG'
#         managed = True
