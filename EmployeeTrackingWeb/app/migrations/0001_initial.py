
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Board',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('b_name', models.CharField(max_length=100)),
            ],
            options={
                'db_table': 'board',
            },
        ),
        migrations.CreateModel(
            name='Employee',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('e_name', models.CharField(max_length=100)),
                ('e_email', models.EmailField(max_length=254)),
                ('e_password', models.CharField(max_length=32)),
                ('e_gender', models.CharField(max_length=25)),
                ('e_contact', models.CharField(max_length=100)),
                ('e_address', models.CharField(max_length=150)),
            ],
            options={
                'db_table': 'employee',
            },
        ),
        migrations.CreateModel(
            name='Organization',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('o_name', models.CharField(max_length=100)),
                ('o_email', models.EmailField(max_length=254)),
                ('o_password', models.CharField(max_length=32)),
                ('o_contact', models.CharField(max_length=100)),
                ('o_website', models.CharField(max_length=100)),
                ('o_address', models.CharField(max_length=150)),
            ],
            options={
                'db_table': 'organization',
            },
        ),
        migrations.CreateModel(
            name='Project',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('p_name', models.CharField(max_length=100)),
                ('p_desc', models.CharField(max_length=200)),
                ('o_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Organization')),
            ],
            options={
                'db_table': 'project',
            },
        ),
        migrations.CreateModel(
            name='Task',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('t_name', models.CharField(max_length=55)),
                ('t_desc', models.CharField(max_length=200)),
                ('t_status', models.CharField(max_length=55)),
                ('t_priority', models.CharField(max_length=30)),
                ('t_assign_date', models.CharField(max_length=55)),
                ('t_deadline_date', models.CharField(max_length=55)),
                ('t_update_date', models.CharField(max_length=55, null=True)),
                ('b_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Board')),
                ('e_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Employee')),
                ('o_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Organization')),
                ('p_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Project')),
            ],
            options={
                'db_table': 'task',
            },
        ),
        migrations.CreateModel(
            name='ScreenShotsMonitoring',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('ssm_img', models.CharField(max_length=255)),
                ('ssm_log_ts', models.CharField(max_length=200)),
                ('e_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Employee')),
                ('o_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Organization')),
            ],
            options={
                'db_table': 'ScreenShotsMonitoring',
            },
        ),
        migrations.CreateModel(
            name='MonitoringDetails',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('md_title', models.CharField(max_length=200)),
                ('md_total_time_seconds', models.CharField(max_length=200)),
                ('md_date', models.CharField(max_length=200)),
                ('e_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Employee')),
                ('o_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Organization')),
            ],
            options={
                'db_table': 'MonitoringDetails',
            },
        ),
        migrations.CreateModel(
            name='Monitoring',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('m_title', models.CharField(max_length=200)),
                ('m_log_ts', models.CharField(max_length=200)),
                ('e_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Employee')),
                ('o_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Organization')),
            ],
            options={
                'db_table': 'monitoring',
            },
        ),
        migrations.CreateModel(
            name='Meeting',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('m_name', models.CharField(max_length=55)),
                ('m_desc', models.CharField(max_length=200)),
                ('m_uuid', models.CharField(max_length=200)),
                ('m_start_date', models.CharField(max_length=55)),
                ('m_stop_date', models.CharField(max_length=55)),
                ('m_start_time', models.CharField(max_length=55)),
                ('m_stop_time', models.CharField(max_length=55)),
                ('o_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Organization')),
                ('p_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Project')),
            ],
            options={
                'db_table': 'meeting',
            },
        ),

        migrations.AddField(
            model_name='employee',
            name='o_id',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Organization'),
        ),
        migrations.AddField(
            model_name='board',
            name='o_id',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Organization'),
        ),

        migrations.CreateModel(
            name='Project_Employee_Linker',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('e_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Employee')),
                ('o_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Organization')),
                ('p_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Project')),
            ],
            options={
                'db_table': 'project_emp_assign',
                'unique_together': {('p_id', 'e_id', 'o_id')},
            },
        ),
        migrations.CreateModel(
            name='PowerMonitoring',
            fields=[
                ('id', models.AutoField(auto_created=True,
                                        primary_key=True, serialize=False, verbose_name='ID')),
                ('pm_status', models.CharField(max_length=255)),
                ('pm_log_ts', models.CharField(max_length=200)),
                ('e_id', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, to='app.Employee')),
                ('o_id', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE, to='app.Organization')),
            ],
            options={
                'db_table': 'PowerMonitoring',
            },
        ),
    ]
