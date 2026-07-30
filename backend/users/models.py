from django.contrib.auth.models import AbstractUser
from django.db import models
from roles.models import Role


class User(AbstractUser):
    email = models.EmailField(unique=True)
    
    username =models.CharField(max_length=50, unique=True)
    first_name=models.CharField(max_length=50)
    last_name=models.CharField(max_length=50)

    role = models.ForeignKey(
    Role,
    on_delete=models.PROTECT,
    related_name="users",
    null=True,
    blank=True,
    )

    REQUIRED_FIELDS= ["email"]

    def __str__(self):
        return f"{self.username} - {self.first_name}  {self.last_name}"