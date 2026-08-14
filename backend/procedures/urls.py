from django.urls import path
from . import views

urlpatterns = [
    path('', views.procedure_list, name="procedure-list"),
    path("status/", views.status_list, name="statuses-list"),
    path("review/", views.procedure_review_list, name="procedure-review-list"),
    path('<int:procedure_id>/', views.procedure_details, name="procedure-CRUD"),
    path("review/<int:version_id>/", views.procedure_review_detail, name="procedure-review-list"),

]
