from django.contrib import admin
from .models import Task, ProcedureExecution
admin.site.register(ProcedureExecution)
admin.site.register(Task)