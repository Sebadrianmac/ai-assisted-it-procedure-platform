from django.urls import path

from . import views

urlpatterns = [
    path("recommend-documents/",views.recommend_documents,name="recommend-documents",),
    path("generate-procedure-steps/", views.generate_procedure_steps, name="generate-procedure_steps",),
    path("generate-procedure/", views.generate_procedure, name="generate-procedure")
]