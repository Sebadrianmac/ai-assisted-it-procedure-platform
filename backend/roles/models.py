from django.db import models


class Role(models.Model):
    code = models.CharField(
        max_length=10,
        unique=True,
    )

    title = models.CharField(
        max_length=50,
        unique=True,
    )

    def __str__(self):
        return self.title