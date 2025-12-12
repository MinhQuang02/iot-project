from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .supabase_client import get_supabase_client
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import pytz

class DashboardDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        supabase = get_supabase_client()
        try:
            # 1. Environmental Data (Latest)
            env_res = supabase.table('TRANG_THAI_NHA_KINH').select('*').order('ThoiGian', desc=True).limit(1).execute()
            env_data = env_res.data[0] if env_res.data else None

            # 2. Total Members
            # Note: Select count is efficiently done via select('count', count='exact')
            member_res = supabase.table('THANH_VIEN_NHA_KINH').select('*', count='exact').execute()
            total_members = member_res.count

            # 3. Active Alerts (Hypothetical: Just counting unread notifications for now as "alerts")
            # Or maybe "TrangThai" in Environmental data could imply alert?
            # Let's count unread notifications for the current user
            user_email = request.user.email
            # We need MaND from Email first
            user_res = supabase.table('NGUOI_DUNG').select('MaND').eq('Email', user_email).execute()
            
            unread_alerts = 0
            if user_res.data:
                ma_nd = user_res.data[0]['MaND']
                notif_res = supabase.table('THONG_BAO').select('*', count='exact').eq('MaND', ma_nd).eq('TrangThai', False).execute()
                unread_alerts = notif_res.count

            # 4. Recent/Top Members (for Dashboard widget)
            # Fetch recent 5 members
            recent_res = supabase.table('THANH_VIEN_NHA_KINH').select('*, NGUOI_DUNG(HoND, TenND, Username)').limit(5).execute()
            
            return Response({
                'environmental': env_data,
                'metrics': {
                    'total_members': total_members,
                    'active_alerts': unread_alerts
                },
                'recent_members': recent_res.data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MemberListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        supabase = get_supabase_client()
        try:
            res = supabase.table('THANH_VIEN_NHA_KINH').select('*, NGUOI_DUNG(HoND, TenND, QuyenHan, Email, Username)').execute()
            return Response(res.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(res.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        # Add Member
        supabase = get_supabase_client()
        try:
            username = request.data.get('username')
            if not username:
                return Response({'error': 'Username is required'}, status=status.HTTP_400_BAD_REQUEST)

            # Find User by Username
            user_res = supabase.table('NGUOI_DUNG').select('*').eq('Username', username).execute()
            if not user_res.data:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
            user_data = user_res.data[0]
            ma_nd = user_data['MaND']
            quyen_han = user_data.get('QuyenHan', 'member')

            # Check if already a member
            existing = supabase.table('THANH_VIEN_NHA_KINH').select('*').eq('MaND', ma_nd).execute()
            if existing.data:
                return Response({'error': 'User is already a member'}, status=status.HTTP_400_BAD_REQUEST)

            # Determine Status
            is_verified = True if quyen_han == 'admin' else False

            # Insert
            new_member = {
                'MaND': ma_nd,
                'TrangThai': is_verified
            }
            res = supabase.table('THANH_VIEN_NHA_KINH').insert(new_member).execute()
            return Response(res.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MemberDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        # Update Member (e.g., Status)
        supabase = get_supabase_client()
        try:
            data = request.data
            res = supabase.table('THANH_VIEN_NHA_KINH').update(data).eq('MaTV', pk).execute()
            return Response(res.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        supabase = get_supabase_client()
        try:
            res = supabase.table('THANH_VIEN_NHA_KINH').delete().eq('MaTV', pk).execute()
            return Response({'message': 'Deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class HistoryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        supabase = get_supabase_client()
        try:
            # LICH_SU_NHA_KINH
            res = supabase.table('LICH_SU_NHA_KINH').select('*').order('ThoiDiemVao', desc=True).execute()
            return Response(res.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        supabase = get_supabase_client()
        try:
            email = request.user.email
            # Get MaND
            user_res = supabase.table('NGUOI_DUNG').select('MaND').eq('Email', email).execute()
            if not user_res.data:
                return Response([], status=status.HTTP_200_OK)
            
            ma_nd = user_res.data[0]['MaND']
            res = supabase.table('THONG_BAO').select('*').eq('MaND', ma_nd).order('ThoiGian', desc=True).execute()
            return Response(res.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(res.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserByMaIDView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, ma_id):
        supabase = get_supabase_client()
        try:
            res = supabase.table('NGUOI_DUNG').select('Username').eq('MaID', ma_id).execute()
            if res.data:
                return Response(res.data[0], status=status.HTTP_200_OK)
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class HistoryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        user = request.user 
        supabase = get_supabase_client()
        try:
            data = request.data
            
            # Check if MaID exists if it is being updated
            if 'MaID' in data:
                ma_id = data['MaID']
                # Verify MaID in NGUOI_DUNG table
                user_check = supabase.table('NGUOI_DUNG').select('MaID').eq('MaID', ma_id).execute()
                if not user_check.data:
                    return Response({'error': f'User ID {ma_id} does not exist.'}, status=status.HTTP_400_BAD_REQUEST)

            res = supabase.table('LICH_SU_NHA_KINH').update(data).eq('MaLS', pk).execute()
            return Response(res.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk):
        supabase = get_supabase_client()
        try:
            res = supabase.table('LICH_SU_NHA_KINH').delete().eq('MaLS', pk).execute()
            return Response({'message': 'Deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StatisticsEnvView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        supabase = get_supabase_client()
        period = request.query_params.get('range', '1d')
        
        now = datetime.now(pytz.utc)
        if period == '1d':
            start_time = now - timedelta(days=1)
            group_fmt = '%H:00' # Group by hour
        elif period == '7d':
            start_time = now - timedelta(days=7)
            group_fmt = '%Y-%m-%d' # Group by day
        elif period == '14d':
            start_time = now - timedelta(days=14)
            group_fmt = '%Y-%m-%d'
        elif period == '30d':
            start_time = now - timedelta(days=30)
            group_fmt = '%Y-%m-%d'
        else:
            return Response({'error': 'Invalid range'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Fetch data (TRANG_THAI_NHA_KINH has NhietDo, DoAm, ThoiGian)
            # Potentially large result for 30d raw data. Should limit or use specific query if possible.
            # For this project scale, raw fetch & python aggreg is accepted.
            res = supabase.table('TRANG_THAI_NHA_KINH').select('*').gte('ThoiGian', start_time.isoformat()).order('ThoiGian').execute()
            data = res.data

            # Aggregate
            agg = defaultdict(list)
            for item in data:
                # Parse date
                dt = datetime.fromisoformat(item['ThoiGian'].replace('Z', '+00:00'))
                key = dt.strftime(group_fmt)
                if period == '1d' and group_fmt == '%H:00':
                     # If 1d, maybe showing Hour is enough? "10:00", "11:00"
                     # If across days (yesterday 2pm to today 2pm), maybe include day?
                     # Let's keep simple hour for now, or short date.
                     # Ideally "Mon 10:00" if chart spans.
                     # Let's stick to key being the label.
                     pass
                agg[key].append(item)

            result = []
            for key, items in agg.items():
                avg_temp = sum(x['NhietDo'] for x in items) / len(items)
                avg_hum = sum(x['DoAm'] for x in items) / len(items)
                result.append({
                    'label': key,
                    'temperature': round(avg_temp, 1),
                    'humidity': round(avg_hum, 1)
                })
            
            # Sort by label? Date keys allow sorting.
            # If 1d (Hours), keys are 00..23. Need robust sort if crossing midnight.
            # Let's just return list in order of creation if keys are created chronologically.
            # Since input was ordered by ThoiGian, keys appearing in order is likely correct.
            
            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StatisticsActivityView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        supabase = get_supabase_client()
        # Weekly Activity (Past 7 days)
        now = datetime.now(pytz.utc)
        start_time = now - timedelta(days=7)

        try:
            res = supabase.table('LICH_SU_NHA_KINH').select('ThoiDiemVao').gte('ThoiDiemVao', start_time.isoformat()).execute()
            
            # Count per day
            counts = Counter()
            # Initialize last 7 days with 0
            date_labels = []
            for i in range(7):
                d = (start_time + timedelta(days=i+1)).strftime('%Y-%m-%d')
                counts[d] = 0
                date_labels.append(d)
                
            for item in res.data:
                dt = datetime.fromisoformat(item['ThoiDiemVao'].replace('Z', '+00:00'))
                key = dt.strftime('%Y-%m-%d')
                if key in counts:
                    counts[key] += 1
            
            result = [{'date': d, 'visits': counts[d]} for d in date_labels]
            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StatisticsTopUsersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        supabase = get_supabase_client()
        period = request.query_params.get('range', 'weekly') # weekly or monthly
        
        now = datetime.now(pytz.utc)
        days = 7 if period == 'weekly' else 30
        start_time = now - timedelta(days=days)

        try:
            res = supabase.table('LICH_SU_NHA_KINH').select('MaID').gte('ThoiDiemVao', start_time.isoformat()).execute()
            
            # Count MaID
            ma_ids = [item['MaID'] for item in res.data if item['MaID']]
            counter = Counter(ma_ids)
            top_ids = counter.most_common(5) # Top 5
            
            result = []
            for ma_id, count in top_ids:
                # Fetch User Info
                user_res = supabase.table('NGUOI_DUNG').select('HoND, TenND, Username').eq('MaID', ma_id).execute()
                user_info = user_res.data[0] if user_res.data else {'Username': 'Unknown', 'HoND': '', 'TenND': ''}
                
                result.append({
                    'ma_id': ma_id,
                    'username': user_info['Username'],
                    'full_name': f"{user_info['TenND']} {user_info['HoND']}".strip(),
                    'visits': count
                })
                
            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

