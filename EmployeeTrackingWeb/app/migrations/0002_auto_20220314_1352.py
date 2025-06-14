
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='monitoring',
            name='m_title',
            field=models.CharField(max_length=200, null=True),
        ),
        migrations.AlterField(
            model_name='task',
            name='b_id',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='boardids', to='app.Board'),
        ),
        migrations.AlterField(
            model_name='task',
            name='e_id',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='employeeids', to='app.Employee'),
        ),
        migrations.AlterField(
            model_name='task',
            name='p_id',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='projectids', to='app.Project'),
        ),
    ]
