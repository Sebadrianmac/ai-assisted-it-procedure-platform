from django.urls import path
from . import views

urlpatterns = [
    path('/', views.procedure_list, name="listProceses")
]
