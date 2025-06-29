
import datetime
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0002_auto_20220314_1352'),
    ]

    operations = [
        migrations.CreateModel(
            name='WorkProductivityDataset',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('w_pds', models.CharField(max_length=255)),
                ('w_type', models.CharField(max_length=255)),
                ('o_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Organization')),
            ],
            options={
                'db_table': 'WorkProductivityDataset',
            },
        ),
        migrations.CreateModel(
            name='OrganizationNews',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('on_title', models.CharField(max_length=255)),
                ('on_desc', models.TextField(max_length=255)),
                ('on_date_time', models.DateTimeField(auto_now=True)),
                ('o_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Organization')),
            ],
            options={
                'db_table': 'OrganizationNews',
            },
        ),
        migrations.CreateModel(
            name='Leaves',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('l_reason', models.CharField(max_length=55)),
                ('l_desc', models.CharField(max_length=200)),
                ('l_start_date', models.CharField(max_length=55)),
                ('l_no_of_leaves', models.PositiveIntegerField()),
                ('l_status', models.CharField(max_length=55)),
                ('e_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Employee')),
                ('o_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Organization')),
            ],
            options={
                'db_table': 'leaves',
            },
        ),
        migrations.CreateModel(
            name='GroupChat',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('value', models.CharField(max_length=250)),
                ('date', models.DateTimeField(blank=True, default=datetime.datetime.now)),
                ('room', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Project')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Employee')),
            ],
            options={
                'db_table': 'groupchat',
            },
        ),
        migrations.CreateModel(
            name='AttendanceLogs',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('a_date', models.CharField(max_length=55)),
                ('a_time', models.CharField(max_length=55)),
                ('a_status', models.CharField(max_length=55)),
                ('a_ip_address', models.CharField(max_length=55)),
                ('a_time_zone', models.CharField(max_length=55)),
                ('a_lat', models.CharField(max_length=55)),
                ('a_long', models.CharField(max_length=55)),
                ('e_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Employee')),
                ('o_id', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='app.Organization')),
            ],
            options={
                'db_table': 'AttendanceLogs',
            },
        ),
    ]
