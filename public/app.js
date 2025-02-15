new Vue({
    el: '#app',
    data: {
        report: [],
        truths: [
            "Правильное понимание",
            "Правильное намерение",
            "Правильная речь",
            "Правильное действие",
            "Правильный образ жизни",
            "Правильное усилие",
            "Правильное внимание",
            "Правильная концентрация"
        ],
        period: 'week'
    },
    computed: {
        periodName() {
            return this.period === 'week' ? 'неделя' : 'месяц';
        }
    },
    methods: {
        fetchReport() {
            fetch(`/api/report?period=${this.period}`)
                .then(response => response.json())
                .then(data => {
                    this.report = data;
                })
                .catch(error => console.error('Ошибка получения отчета:', error));
        },
        setPeriod(newPeriod) {
            this.period = newPeriod;
            this.fetchReport();
        }
    },
    mounted() {
        this.fetchReport();
    }
});
