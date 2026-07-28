from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    email = models.EmailField(unique=True)
    
    username =models.CharField(max_length=50, unique=True)
    first_name=models.CharField(max_length=50)
    last_name=models.CharField(max_length=50)

    REQUIRED_FIELDS= ["email"]

    def __str__(self):
        return f"{self_id}.{self.username} - {self.first_name}  {self.last_name}"